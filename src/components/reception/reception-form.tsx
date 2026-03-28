"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StepClient } from "./step-client";
import { StepVehicle } from "./step-vehicle";
import { StepIntake } from "./step-intake";
import { StepPannes } from "./step-pannes";
import { StepReview } from "./step-review";

export type ReceptionData = {
  client: {
    id?: string;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    adresse?: string;
  } | null;
  vehicle: {
    id?: string;
    matricule: string;
    marque: string;
    modele: string;
    typeVehicule: string;
    numeroChassis?: string;
  } | null;
  intake: {
    chauffeurNom: string;
    chauffeurTel: string;
    serviceDorigine: string;
    kilometrage: number;
    niveauCarburant: string;
    niveauUsurePneus: string;
    lotDeBord: string;
    prochaineVidange: string;
  } | null;
  pannes: { description: string }[];
};

const STEPS = [
  { label: "Client" },
  { label: "Véhicule" },
  { label: "Réception" },
  { label: "Pannes" },
  { label: "Résumé" },
];

export function ReceptionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<ReceptionData>({
    client: null,
    vehicle: null,
    intake: null,
    pannes: [],
  });

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isActive &&
                      "border-primary bg-primary/10 text-primary",
                    !isCompleted &&
                      !isActive &&
                      "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                <span
                  className={cn(
                    "mt-1 text-xs hidden sm:block",
                    isActive && "text-primary font-medium",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    stepNumber < currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form area */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <StepClient
              initialData={data.client}
              onNext={(client) => {
                setData((prev) => ({ ...prev, client }));
                setCurrentStep(2);
              }}
            />
          )}
          {currentStep === 2 && (
            <StepVehicle
              client={data.client!}
              initialData={data.vehicle}
              onNext={(vehicle) => {
                setData((prev) => ({ ...prev, vehicle }));
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <StepIntake
              initialData={data.intake}
              onNext={(intake) => {
                setData((prev) => ({ ...prev, intake }));
                setCurrentStep(4);
              }}
              onBack={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 4 && (
            <StepPannes
              initialData={data.pannes}
              onNext={(pannes) => {
                setData((prev) => ({ ...prev, pannes }));
                setCurrentStep(5);
              }}
              onBack={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 5 && (
            <StepReview
              data={data}
              onBack={() => setCurrentStep(4)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
