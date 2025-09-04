
import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle, AlertTriangle, Download, ArrowRight, Loader2, FileCheck2 } from 'lucide-react';

import { jobsImport } from '@/api/functions';
import { importCleanedProjects } from '@/api/functions';
import { UploadFile } from '@/api/integrations';
import { createPageUrl } from '@/utils';

/* ----------------------------- Config / helpers ---------------------------- */

const POLL_MS = 3000;     // poll every 3s (gentler on API)
const MAX_POLLS = 240;    // ~12 minutes max
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRateLimit(err) {
  const msg = err?.response?.data?.error || err?.message || '';
  const http = err?.response?.status;
  return http === 429 || /rate limit/i.test(msg);
}

/** Exponential backoff wrapper for any API call */
async function callWithBackoff(fn, { max = 6, base = 500 } = {}) {
  let attempt = 0;
  // jitter 0–150ms to avoid thundering herd
  const jitter = () => Math.floor(Math.random() * 150);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (isRateLimit(err) && attempt < max) {
        const wait = Math.min(10_000, base * 2 ** attempt) + jitter();
        console.warn(`[rate-limit] retry ${attempt + 1}/${max} after ${wait}ms`, err?.response?.data || err?.message);
        await sleep(wait);
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

/** Nice error text from Axios/Fetch */
function errorText(error) {
  if (error?.response?.data) {
    return typeof error.response.data === 'string'
      ? error.response.data
      : JSON.stringify(error.response.data);
  }
  return error?.message || String(error);
}

/* -------------------------------- Component -------------------------------- */

export default function JobsImport() {
  const navigate = useNavigate();

  // State for original import flow
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload' | 'preview' | 'complete'
  const [importJobId, setImportJobId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [commitResult, setCommitResult] = useState(null);
  const [createPlaceholderClients, setCreatePlaceholderClients] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // State for new "Cleaned CSV" import flow
  const [isCleanImportLoading, setIsCleanImportLoading] = useState(false);
  const [cleanImportMessage, setCleanImportMessage] = useState('');
  const [cleanImportResult, setCleanImportResult] = useState(null);
  const [cleanImportError, setCleanImportError] = useState('');


  // Guards to prevent duplicate/concurrent flows
  const processingRef = useRef(false);
  const pollingRef = useRef(false);

  const waitForParsed = useCallback(async (jobId) => {
    if (pollingRef.current) return; // never overlap
    pollingRef.current = true;

    try {
      let attempts = 0;
      while (attempts++ < MAX_POLLS) {
        const statusRes = await callWithBackoff(() =>
          jobsImport({ action: 'status', import_job_id: jobId })
        );
        const job = statusRes.data;

        if (job?.status === 'parsed') {
          const sampleRes = await callWithBackoff(() =>
            jobsImport({ action: 'sample_preview_rows', import_job_id: jobId })
          );

          const errorsObj = {};
          (job.error_summary || []).forEach((e) => {
            errorsObj[e.error] = e.count;
          });

          return {
            success: true,
            status: 'parsed',
            total_rows: job.total_rows || 0,
            accepted: job.accepted_rows || 0,
            rejected: job.rejected_rows || 0,
            unique_job_numbers: job.unique_job_numbers || 0,
            errors: errorsObj,
            warnings: {},
            sample: sampleRes.data || [],
          };
        }

        if (job?.status === 'parsing') {
          const valid = job.accepted_rows ?? 0;
          const invalid = job.rejected_rows ?? 0;
          setLoadingMessage(`Parsing... (${valid} valid, ${invalid} invalid so far)`);
          await sleep(POLL_MS);
          continue;
        }

        if (job && (job.status === 'uploading' || job.status === 'uploaded')) {
          setLoadingMessage('Queued…');
          await sleep(POLL_MS);
          continue;
        }

        throw new Error((job && job.error) || `Preview failed (status: ${job ? job.status : 'unknown'})`);
      }
      throw new Error('Timed out waiting for preview to finish.');
    } finally {
      pollingRef.current = false;
    }
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file) { setErrorMessage('No file provided.'); return; }
    const okName = /\.csv(\.gz)?$/i.test(file.name); // allows .csv and .csv.gz
    if (!okName) {
   setErrorMessage('Invalid file type. Please upload a .csv or .csv.gz file.');
    return;
}

    if (processingRef.current) return; // debounce re-entrancy
    processingRef.current = true;

    setErrorMessage('');
    setIsLoading(true);

    try {
      setLoadingMessage('Initializing import...');
      const initResponse = await callWithBackoff(() =>
        jobsImport({ action: 'upload_init', filename: file.name })
      );

      const currentImportJobId = initResponse?.data?.import_job_id;
      if (!currentImportJobId) throw new Error('Failed to initialize import');
      setImportJobId(currentImportJobId);

      setLoadingMessage('Uploading file...');
      const uploadResponse = await callWithBackoff(() => UploadFile({ file }));
      if (!uploadResponse?.file_url) throw new Error('Failed to upload file to storage');

      setLoadingMessage('Finalizing upload...');
      await callWithBackoff(() =>
        jobsImport({
          action: 'upload_finalize',
          import_job_id: currentImportJobId,
          file_url: uploadResponse.file_url,
        })
      );

      setLoadingMessage('Parsing and validating file...');
      const enq = await callWithBackoff(() =>
        jobsImport({ action: 'preview', import_job_id: currentImportJobId })
      );
      if (!enq?.data?.success) {
        throw new Error(enq?.data?.error || 'Failed to enqueue preview');
      }

      const finalPreview = await waitForParsed(currentImportJobId);
      setPreviewData(finalPreview);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(`Upload failed: ${errorText(error)}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      processingRef.current = false;
    }
  }, [waitForParsed]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    processFile(file);
  };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const handleCommit = async () => {
    if (!importJobId) return;
    const confirmed = window.confirm(
      `This will create or update ${previewData?.accepted || 0} projects. This operation is idempotent. Are you sure?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    setLoadingMessage('Committing projects... This can take several minutes.');
    try {
      const response = await callWithBackoff(() =>
        jobsImport({
          action: 'commit',
          import_job_id: importJobId,
          create_placeholder_clients: createPlaceholderClients,
        })
      );

      if (response?.data?.success) {
        setCommitResult(response.data);
        setCurrentStep('complete');
      } else {
        throw new Error(response?.data?.error || 'Commit failed');
      }
    } catch (error) {
      console.error('Commit error:', error);
      setErrorMessage(`Import failed: ${errorText(error)}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDownloadFullReport = () => {
    if (!importJobId) return;
    window.open(`/api/functions/jobsImport?import_job_id=${importJobId}`, '_blank');
  };

  const resetImport = () => {
    setCurrentStep('upload');
    setImportJobId(null);
    setPreviewData(null);
    setCommitResult(null);
    setErrorMessage('');
  };

  const handleCleanFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCleanImportError('No file selected.');
      return;
    }
    
    setIsCleanImportLoading(true);
    setCleanImportMessage('Uploading file...');
    setCleanImportResult(null);
    setCleanImportError(''); // Clear previous error

    try {
      const uploadResponse = await UploadFile({ file });
      if (!uploadResponse?.file_url) throw new Error('Failed to upload file to storage');
      
      setCleanImportMessage('Processing cleaned CSV...');
      const { data: result } = await importCleanedProjects({ file_url: uploadResponse.file_url });
      
      // Check for errors within the result object
      if (result.errors && result.errors.length > 0) {
        setCleanImportError(`Import completed with issues: ${result.errors.join(', ')}`);
      }
      setCleanImportResult(result);

    } catch (error) {
      console.error('Clean Import error:', error);
      const errorMsg = error?.response?.data?.errors?.join(', ') || error.message || 'An unknown error occurred.';
      setCleanImportError(`Import failed: ${errorMsg}`);
    } finally {
      setIsCleanImportLoading(false);
      setCleanImportMessage('');
      // Reset the file input so the same file can be re-uploaded
      event.target.value = '';
    }
  };


  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs Import</h1>
          <p className="text-gray-600">Import legacy jobs data from CSV into the Projects system.</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>An Error Occurred</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* New Card for Cleaned Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-green-600"/>
                Import Cleaned CSV
            </CardTitle>
            <CardDescription>
              For pre-formatted CSV files. This process is faster and directly creates projects and clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <label className="cursor-pointer">
                <Input
                  id="clean-file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCleanFileChange}
                  className="hidden"
                  disabled={isCleanImportLoading}
                />
                <Button
                  disabled={isCleanImportLoading}
                  onClick={() => document.getElementById('clean-file-upload')?.click()}
                  variant="secondary"
                >
                  {isCleanImportLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {cleanImportMessage || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Cleaned CSV File
                    </>
                  )}
                </Button>
              </label>

            {cleanImportError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Import Error</AlertTitle>
                <AlertDescription>{cleanImportError}</AlertDescription>
              </Alert>
            )}
            
            {cleanImportResult && (
               <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Import Complete!</AlertTitle>
                <AlertDescription>
                  <p>Successfully created <strong>{cleanImportResult.projectsCreated}</strong> projects.</p>
                  <p>Created <strong>{cleanImportResult.clientsCreated}</strong> new clients.</p>
                  {cleanImportResult.failedRows > 0 && <p className="text-red-700"><strong>{cleanImportResult.failedRows}</strong> rows failed to import.</p>}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {currentStep === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Raw Jobs CSV (Legacy Wizard)</CardTitle>
              <CardDescription>File must be UTF-8 encoded CSV. This wizard provides detailed validation and preview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Drop your CSV file here or click to browse</h3>
                <div className="pt-4">
                  <label className="cursor-pointer">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.csv.gz,.gz"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <Button
                      disabled={isLoading}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {loadingMessage || 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div >
            </CardContent>
          </Card>
        )}

        {currentStep === 'preview' && previewData && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { title: 'Total Rows', value: previewData.total_rows },
                { title: 'Valid Rows', value: previewData.accepted, color: 'text-green-600' },
                { title: 'Invalid Rows', value: previewData.rejected, color: 'text-red-600' },
                { title: 'Unique Jobs', value: previewData.unique_job_numbers },
              ].map((item) => (
                <Card key={item.title}>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${item.color || ''}`}>{item.value}</div>
                    <div className="text-sm text-gray-600">{item.title}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="sample" className="w-full">
              <TabsList>
                <TabsTrigger value="sample">
                  Sample Data ({(previewData.sample && previewData.sample.length) || 0})
                </TabsTrigger>
                <TabsTrigger value="errors">
                  Validation Errors ({Object.keys(previewData.errors || {}).length > 0 ? previewData.rejected : 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sample">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview (First 25 Valid Rows)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job No</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Start Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(previewData.sample || []).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.job_no_int}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.budget_num}</TableCell>
                            <TableCell>{row.start_date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="errors">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Validation Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {previewData.rejected > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Error Description</TableHead>
                            <TableHead>Occurrences</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(previewData.errors).map(([error, count]) => (
                            <TableRow key={error}>
                              <TableCell className="text-red-600">{error}</TableCell>
                              <TableCell>{count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center p-4 text-green-600">
                        <CheckCircle className="mx-auto h-8 w-8" />
                        <p>No errors found!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card>
              <CardHeader><CardTitle>Import Options</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="placeholder-clients"
                    checked={createPlaceholderClients}
                    onCheckedChange={(v) => setCreatePlaceholderClients(Boolean(v))}
                  />
                  <Label htmlFor="placeholder-clients">
                    Create placeholder clients for unmatched Client IDs.
                  </Label>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  When enabled, projects with unrecognized Client IDs get placeholders and are tagged
                  &quot;needs_client_merge&quot; for later review.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetImport}>Start Over</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleDownloadFullReport} disabled={!importJobId}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Full Report
                </Button>
                <Button onClick={handleCommit} disabled={isLoading || (previewData?.accepted || 0) === 0}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {loadingMessage}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Import {previewData?.accepted || 0} Projects
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && commitResult && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Import Completed!</h3>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{commitResult.created}</div>
                  <div className="text-sm text-green-800">New Projects Created</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{commitResult.updated}</div>
                  <div className="text-sm text-blue-800">Existing Projects Updated</div>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate(createPageUrl('Projects'))}>View Projects</Button>
                <Button variant="outline" onClick={resetImport}>Import Another File</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
