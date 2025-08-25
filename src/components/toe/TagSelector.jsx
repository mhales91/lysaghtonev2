import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function TagSelector({ tags, onSelectTag, title }) {
  if (!tags || tags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No suggestions available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tags.map((tag) => (
          <div key={tag.id} className="p-2 border rounded hover:bg-gray-50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tag.token}</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {tag.suggested_text}
                </p>
                {tag.usage_frequency && (
                  <Badge variant="outline" className="text-xs mt-1">
                    Used {tag.usage_frequency} times
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelectTag(tag)}
                className="flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}