import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export default function MenuSelector({ type, items, selectedId, onSelect, label }) {
  const typeLabels = {
    entree: "Entrée",
    plat: "Plat",
    dessert: "Dessert",
    boisson: "Boisson"
  };

  const handleSelect = (itemId) => {
    onSelect(itemId);
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{label || typeLabels[type]}</Label>
      <div className="grid gap-3">
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <Card 
              key={item.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-gray-400'
              }`}
              onClick={() => handleSelect(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.name}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 flex-shrink-0">
                    {item.price.toFixed(2)}€
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}