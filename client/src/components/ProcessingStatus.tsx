import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ProcessingStep } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  error: string | null;
  isVisible: boolean;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ steps, error, isVisible }) => {
  if (!isVisible) return null;

  return (
    <Card className="mb-8 bg-[#F6F8FA] border-[#D0D7DE]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Processing Repository</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start">
              <div className="h-6 w-6 mr-2 flex-shrink-0">
                {step.status === 'complete' && (
                  <CheckCircle className="h-6 w-6 text-[#2EA44F]" />
                )}
                {step.status === 'active' && (
                  <div className="loader h-5 w-5 rounded-full border-2 border-[#D0D7DE]"></div>
                )}
                {step.status === 'pending' && (
                  <div className="h-6 w-6 rounded-full border-2 border-[#D0D7DE] flex items-center justify-center text-gray-400">
                    <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                  </div>
                )}
                {step.status === 'error' && (
                  <AlertCircle className="h-6 w-6 text-[#CF222E]" />
                )}
              </div>
              <div className={step.status === 'pending' ? 'text-gray-400' : 'text-[#1F2328]'}>
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error processing repository</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
