import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Building, Calendar, MapPin, CheckSquare, Square } from 'lucide-react';
import { STATUS_BADGE_CLASS } from '../constants/jobStatuses';

/**
 * @param {{ internship: object, isSelectionMode: boolean, selectedJobs: Set<string>,
 *           toggleJobSelection: Function, onEdit: Function, index: number }} props
 */
export function JobCard({ internship, isSelectionMode, selectedJobs, toggleJobSelection, onEdit, index }) {
  return (
    <Card
      style={{ transitionDelay: `${index * 70}ms` }}
      className="relative h-full min-h-[320px] max-h-[320px] flex flex-col rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      {isSelectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={() => toggleJobSelection(internship._id)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {selectedJobs.has(internship._id) ? (
              <CheckSquare className="h-5 w-5 text-orange-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      )}

      <CardHeader className="pt-6 pb-2">
        <div className="flex justify-between items-start w-full">
          <div className={isSelectionMode ? 'pr-8' : ''}>
            <CardTitle className="text-lg clamp-1">{internship.role}</CardTitle>
            <CardDescription className="flex items-center mt-1 clamp-1">
              <Building className="h-4 w-4 mr-1" />
              {internship.company}
            </CardDescription>
          </div>
          <Badge className={`${STATUS_BADGE_CLASS[internship.status] || 'bg-muted text-muted-foreground'} rounded-full px-2 py-1 text-xs`}>
            {internship.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="clamp-1">{internship.location}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            Applied {new Date(internship.dateApplied).toLocaleDateString(undefined, { timeZone: 'UTC' })}
          </div>
          {internship.interviewDate && (
            <div className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Interview:{' '}
              {new Date(internship.interviewDate).toLocaleDateString(undefined, {
                timeZone: 'UTC',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
          {Array.isArray(internship.statusHistory) &&
            internship.statusHistory.length > 1 &&
            (() => {
              const hist = internship.statusHistory;
              const changes = hist.filter((h, idx) => idx === 0 || h.status !== hist[idx - 1].status);
              if (changes.length < 2) return null;
              const last = changes[changes.length - 1];
              const when = last.at
                ? new Date(last.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';
              return (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" aria-hidden="true" />
                  {`→ ${last.status}${when ? ` · ${when}` : ''}`}
                </div>
              );
            })()}
          {internship.stipend && (
            <div className="text-sm font-medium text-green-600">{internship.stipend}</div>
          )}
          {internship.notes && (
            <p className="text-sm text-muted-foreground clamp-2">{internship.notes}</p>
          )}
        </div>
        <div className="flex gap-2 mt-auto pt-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => onEdit(internship)}>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
