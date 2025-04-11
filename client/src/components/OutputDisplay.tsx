import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle, FolderIcon } from 'lucide-react';
import { ProcessingResult } from '@/types';
import { formatNumber } from '@/utils/formatting';
import { useToast } from '@/hooks/use-toast';

interface OutputDisplayProps {
  result: ProcessingResult | null;
  isVisible: boolean;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ result, isVisible }) => {
  const [isCopied, setIsCopied] = React.useState(false);
  const outputRef = useRef<HTMLPreElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset the copied state when the result changes
    setIsCopied(false);
  }, [result]);

  if (!isVisible) return null;
  
  // Show empty state if there's no result yet
  if (!result) {
    return (
      <Card className="bg-white border-[#D0D7DE] mb-6">
        <div className="bg-[#F6F8FA] px-4 py-3 flex justify-between items-center border-b border-[#D0D7DE]">
          <div className="flex space-x-4 items-center">
            <h3 className="font-semibold">Repository Content</h3>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
              0 files, 0 lines
            </span>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <FolderIcon className="h-12 w-12 mb-4 text-gray-300" />
            <p>No repository content to display yet.</p>
            <p className="text-sm">Enter a GitHub URL above to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = async () => {
    if (!outputRef.current?.textContent) return;
    
    try {
      await navigator.clipboard.writeText(outputRef.current.textContent);
      setIsCopied(true);
      toast({
        title: "Content copied!",
        description: "Repository content has been copied to clipboard."
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or use the download option.",
        variant: "destructive"
      });
    }
  };

  const downloadFile = () => {
    if (!outputRef.current?.textContent) return;
    
    const blob = new Blob([outputRef.current.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repository-content.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Repository content is being downloaded as a text file."
    });
  };

  // Empty state when no files were found
  if (result.fileCount === 0 && result.lineCount === 0) {
    return (
      <Card className="bg-white border-[#D0D7DE] mb-6">
        <div className="bg-[#F6F8FA] px-4 py-3 flex justify-between items-center border-b border-[#D0D7DE]">
          <div className="flex space-x-4 items-center">
            <h3 className="font-semibold">Repository Content</h3>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
              {formatNumber(result.fileCount)} files, {formatNumber(result.lineCount)} lines
            </span>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-center">No files could be processed from this repository.</p>
            <p className="text-sm text-center mt-2">
              This could happen if the repository is private, empty, or contains only binary files.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#D0D7DE] mb-6">
      <div className="bg-[#F6F8FA] px-4 py-3 flex justify-between items-center border-b border-[#D0D7DE]">
        <div className="flex space-x-4 items-center">
          <h3 className="font-semibold">Repository Content</h3>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
            {formatNumber(result.fileCount)} files, {formatNumber(result.lineCount)} lines
          </span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center text-sm border-[#D0D7DE] hover:bg-[#F6F8FA]"
            onClick={copyToClipboard}
          >
            {isCopied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1 text-[#2EA44F]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center text-sm border-[#D0D7DE] hover:bg-[#F6F8FA]"
            onClick={downloadFile}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="relative max-h-[600px] overflow-auto custom-scrollbar">
          <pre ref={outputRef} className="code-output p-4 whitespace-pre-wrap font-mono text-sm">
            {result.content}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutputDisplay;
