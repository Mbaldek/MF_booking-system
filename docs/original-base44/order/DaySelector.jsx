import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "lucide-react";

export default function DaySelector({ days, selectedDays, onToggleDay }) {
  const handleClick = (day) => {
    onToggleDay(day);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Sélectionnez vos jours de commande
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {days.map((day) => {
            const isSelected = selectedDays.includes(day);
            return (
              <div
                key={day}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleClick(day)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="flex-1 font-medium">
                  {format(new Date(day), "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}