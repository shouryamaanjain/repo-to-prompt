import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle } from 'lucide-react';
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

  if (!isVisible || !result) return null;

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
          <pre ref={outputRef} className="code-output p-4 whitespace-pre-wrap">
            {result.content}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutputDisplay;
