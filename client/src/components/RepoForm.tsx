import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gitHubUrlSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RepoFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

// Define form schema
const formSchema = z.object({
  url: gitHubUrlSchema,
});

type FormValues = z.infer<typeof formSchema>;

const RepoForm: React.FC<RepoFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.url);
  };

  const loadSampleRepo = () => {
    form.setValue('url', 'https://github.com/facebook/react');
    form.trigger('url');
  };

  return (
    <Card className="mb-8 bg-[#F6F8FA] border-[#D0D7DE]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Enter GitHub Repository URL</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#D0D7DE] bg-gray-50 text-gray-500 sm:text-sm">
                      Repository URL
                    </span>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://github.com/username/repository"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-[#0969DA] focus:border-[#0969DA] border-[#D0D7DE]"
                        disabled={isLoading}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                  <p className="mt-1 text-sm text-gray-500">Example: https://github.com/facebook/react</p>
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-4">
              <Button 
                type="submit" 
                className="bg-[#2EA44F] hover:bg-[#2c974b] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Repository'
                )}
              </Button>
              <Button 
                type="button" 
                variant="link" 
                className="text-[#0969DA]"
                onClick={loadSampleRepo}
                disabled={isLoading}
              >
                Try with sample repo
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RepoForm;
