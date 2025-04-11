import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RepoForm from '@/components/RepoForm';
import ProcessingStatus from '@/components/ProcessingStatus';
import OutputDisplay from '@/components/OutputDisplay';
import { ProcessingStep, ProcessingResult } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const initialSteps: ProcessingStep[] = [
  {
    id: 1,
    title: 'Validating repository URL',
    description: 'Checking if the repository exists and is accessible',
    status: 'pending'
  },
  {
    id: 2,
    title: 'Fetching repository structure',
    description: 'Scanning directories and files',
    status: 'pending'
  },
  {
    id: 3,
    title: 'Extracting file contents',
    description: 'Reading and processing file data',
    status: 'pending'
  },
  {
    id: 4,
    title: 'Compiling merged file',
    description: 'Organizing content with file paths',
    status: 'pending'
  }
];

const Home: React.FC = () => {
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [showProcessing, setShowProcessing] = useState<boolean>(false);
  const [showOutput, setShowOutput] = useState<boolean>(false);
  
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest('POST', '/api/process-repository', { url });
      return response.json();
    },
    onMutate: () => {
      // Reset states
      setSteps(initialSteps);
      setError(null);
      setResult(null);
      setShowProcessing(true);
      setShowOutput(false);
      
      // Update first step to active
      updateStepStatus(1, 'active');
    },
    onSuccess: (data) => {
      // Complete all steps
      steps.forEach((step, index) => {
        const delay = 500 * (index + 1);
        setTimeout(() => {
          updateStepStatus(step.id, 'complete');
          
          // If it's the last step, set result and show output
          if (index === steps.length - 1) {
            setResult(data);
            setShowOutput(true);
            toast({
              title: "Repository processed successfully",
              description: `Processed ${data.fileCount} files with ${data.lineCount} lines of code.`
            });
          }
        }, delay);
      });
    },
    onError: (error: any) => {
      // Set error status and message
      const message = error.message || 'An error occurred while processing the repository.';
      setError(message);
      
      // Mark current step as error
      const currentStep = steps.find(step => step.status === 'active');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
      
      toast({
        title: "Processing failed",
        description: message,
        variant: "destructive"
      });
    }
  });

  const updateStepStatus = (stepId: number, status: ProcessingStep['status']) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleSubmit = (url: string) => {
    processMutation.mutate(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-4xl flex-grow">
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Convert GitHub Repository to Single Text File</h2>
          <p className="text-gray-600">
            This tool lets you convert an entire GitHub repository into a single text file, 
            preserving file paths and content organization.
          </p>
        </section>
        
        <RepoForm 
          onSubmit={handleSubmit} 
          isLoading={processMutation.isPending} 
        />
        
        <ProcessingStatus 
          steps={steps} 
          error={error} 
          isVisible={showProcessing}
        />
        
        <OutputDisplay 
          result={result} 
          isVisible={showOutput}
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
