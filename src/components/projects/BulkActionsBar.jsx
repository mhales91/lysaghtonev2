import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BulkActionsBar({ selectedCount, onDelete, onStatusUpdate, projectStatusOptions }) {
  return (
    <div className="flex items-center justify-between p-3 mb-6 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="text-sm font-medium text-purple-800">
        {selectedCount} project(s) selected
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Set status:</span>
            <Select onValueChange={onStatusUpdate}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                {projectStatusOptions.map(s => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Selected
        </Button>
      </div>
    </div>
  );
}