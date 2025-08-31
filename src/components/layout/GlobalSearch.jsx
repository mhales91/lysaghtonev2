import React, { useState, useRef, useEffect } from 'react';
import { Search, X, FileText, Building2, FolderOpen, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Project, Client, TOE } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    projects: [],
    clients: [],
    toes: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch(query);
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setResults({ projects: [], clients: [], toes: [] });
      setHasSearched(false);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsSearching(true);
    try {
      const searchTerm = searchQuery.toLowerCase();
      
      // Search projects
      const allProjects = await Project.list('-created_date', 200);
      const projectResults = allProjects.filter(project => 
        project.project_name?.toLowerCase().includes(searchTerm) ||
        project.job_number?.toString().includes(searchTerm) ||
        project.legacy_job_number?.toLowerCase().includes(searchTerm)
      ).slice(0, 5);

      // Search clients
      const allClients = await Client.list('-created_date', 100);
      const clientResults = allClients.filter(client => 
        client.company_name?.toLowerCase().includes(searchTerm) ||
        client.contact_person?.toLowerCase().includes(searchTerm)
      ).slice(0, 5);

      // Search TOEs
      const allTOEs = await TOE.list('-created_date', 100);
      const toeResults = allTOEs.filter(toe => 
        toe.project_title?.toLowerCase().includes(searchTerm)
      ).slice(0, 5);

      setResults({
        projects: projectResults,
        clients: clientResults,
        toes: toeResults
      });
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ projects: [], clients: [], toes: [] });
    }
    setIsSearching(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults({ projects: [], clients: [], toes: [] });
    setHasSearched(false);
  };

  const closeSearch = () => {
    setIsOpen(false);
    clearSearch();
  };

  const handleResultClick = () => {
    closeSearch();
  };

  const totalResults = results.projects.length + results.clients.length + results.toes.length;

  return (
    <div className="relative" ref={searchRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-64 justify-start text-left text-muted-foreground"
      >
        <Search className="w-4 h-4 mr-2" />
        Search projects, clients, TOEs...
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-96 max-w-[calc(100vw-2rem)] right-0 z-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search by job number, project name, client..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={clearSearch}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={closeSearch}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && hasSearched && totalResults === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {!isSearching && totalResults > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.projects.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Projects ({results.projects.length})
                    </h4>
                    <div className="space-y-2">
                      {results.projects.map(project => (
                        <Link
                          key={project.id}
                          to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                          onClick={handleResultClick}
                          className="block p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{project.project_name}</div>
                              <div className="text-sm text-muted-foreground">
                                Job #{project.job_number || project.legacy_job_number}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {project.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.clients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                      <Building2 className="w-4 h-4 mr-1" />
                      Clients ({results.clients.length})
                    </h4>
                    <div className="space-y-2">
                      {results.clients.map(client => (
                        <Link
                          key={client.id}
                          to={createPageUrl('CRM')}
                          onClick={handleResultClick}
                          className="block p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{client.company_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {client.contact_person}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {client.crm_stage}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.toes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      TOEs ({results.toes.length})
                    </h4>
                    <div className="space-y-2">
                      {results.toes.map(toe => (
                        <Link
                          key={toe.id}
                          to={createPageUrl('TOEManager')}
                          onClick={handleResultClick}
                          className="block p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{toe.project_title}</div>
                              <div className="text-sm text-muted-foreground">
                                v{toe.version}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {toe.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isSearching && query.length < 2 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Type at least 2 characters to search
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}