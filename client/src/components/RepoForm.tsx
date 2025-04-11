import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gitHubUrlSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RepoFormProps {
  onSubmit: (url: string, token?: string) => void;
  isLoading: boolean;
}

// Define form schema
const formSchema = z.object({
  url: gitHubUrlSchema,
  token: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const RepoForm: React.FC<RepoFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      token: '',
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values.url, values.token);
  };

  const loadSampleRepo = () => {
    form.setValue('url', 'https://github.com/facebook/react');
    form.trigger('url');
  };

  return (
    <Card className="mb-8 bg-[#F6F8FA] border-[#D0D7DE]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Enter GitHub Repository URL</CardTitle>
        <CardDescription>
          Processing large repositories may require a GitHub token to avoid rate limits
        </CardDescription>
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

            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="text-sm font-medium">
                      GitHub Personal Access Token
                    </FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-[#0969DA] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            GitHub limits API requests for unauthenticated users. Adding a token increases your rate limit.
                            <br/><br/>
                            You can create a token at <b>GitHub → Settings → Developer settings → Personal access tokens</b>.
                            <br/><br/>
                            Only public repo access is needed.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Optional: ghp_your_github_token"
                      className="w-full border-[#D0D7DE] focus:ring-[#0969DA] focus:border-[#0969DA]"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
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
