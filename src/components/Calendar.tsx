'use client';

import React, { useState } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'consultation' | 'diagnostic' | 'prescription' | 'referral';
  status?: string;
  description?: string;
  provider?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  highlightToday?: boolean;
}

export default function Calendar({
  events,
  onEventClick,
  onDateClick,
  highlightToday = true
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { year, month, daysInMonth, startingDayOfWeek };
  };

  const { year, month, daysInMonth, startingDayOfWeek } = getMonthData();

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-500';
      case 'diagnostic':
        return 'bg-purple-500';
      case 'prescription':
        return 'bg-green-500';
      case 'referral':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-button transition-colors"
          >
            Today
          </button>
          <button
            onClick={previousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-button transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-button transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const date = new Date(year, month, day);
            const dayEvents = getEventsForDate(date);
            const isTodayDate = isToday(date);

            return (
              <button
                key={day}
                onClick={() => onDateClick && onDateClick(date)}
                className={`aspect-square p-1 rounded-button text-sm transition-colors relative ${
                  isTodayDate && highlightToday
                    ? 'bg-primary-100 font-semibold text-primary-900'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm ${isTodayDate ? 'font-bold' : ''}`}>
                    {day}
                  </span>
                  
                  {dayEvents.length > 0 && (
                    <div className="flex-1 flex flex-col justify-end gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick && onEventClick(event);
                          }}
                          className={`h-1 rounded-full ${getEventColor(event.type)} cursor-pointer hover:opacity-75`}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-gray-500 mt-0.5">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="font-medium text-gray-700">Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Consultation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-600">Diagnostic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Prescription</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">Referral</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Upcoming Events List Component
interface UpcomingEventsProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  maxEvents?: number;
}

export function UpcomingEvents({ events, onEventClick, maxEvents = 5 }: UpcomingEventsProps) {
  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxEvents);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return '👨‍⚕️';
      case 'diagnostic':
        return '🔬';
      case 'prescription':
        return '💊';
      case 'referral':
        return '🏥';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'border-blue-200 bg-blue-50';
      case 'diagnostic':
        return 'border-purple-200 bg-purple-50';
      case 'prescription':
        return 'border-green-200 bg-green-50';
      case 'referral':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-6 text-center">
        <div className="text-4xl mb-3">📅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Appointments</h3>
        <p className="text-sm text-gray-600">Your upcoming appointments will appear here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {upcomingEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => onEventClick && onEventClick(event)}
            className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors border-l-4 ${getEventColor(event.type)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{event.title}</p>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{formatDate(new Date(event.date))}</span>
                  {event.time && <span>• {event.time}</span>}
                  {event.provider && <span>• {event.provider}</span>}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
