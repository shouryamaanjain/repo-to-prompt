import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F6F8FA] border-t border-[#D0D7DE] py-6 mt-8">
      <div className="container mx-auto px-4 md:px-6 text-center text-sm text-gray-600">
        <p>GitFileMerger is not affiliated with GitHub. Made for developers, by developers.</p>
        <p className="mt-2">© {new Date().getFullYear()} GitFileMerger</p>
      </div>
    </footer>
  );
};

export default Footer;
