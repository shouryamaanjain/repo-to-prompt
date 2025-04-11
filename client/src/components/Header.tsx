import React from 'react';
import { Link } from 'wouter';
import { GitBranch } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-[#24292E] text-white py-4">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5" />
          <h1 className="text-xl font-bold">GitFileMerger</h1>
        </div>
        <div className="flex items-center space-x-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm hover:underline"
          >
            GitHub
          </a>
          <Link 
            href="/" 
            className="text-sm hover:underline"
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
