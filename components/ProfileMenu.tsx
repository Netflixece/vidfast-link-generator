import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, DownloadIcon, UploadIcon, TrashIcon } from './Icons';

interface ProfileMenuProps {
    onImport: (file: File) => void;
    onExport: () => void;
    onReset: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onImport, onExport, onReset }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImport(file);
        }
        setIsOpen(false);
        // Reset the input value to allow re-uploading the same file
        if(event.target) {
            event.target.value = '';
        }
    };

    const handleExportClick = () => {
        onExport();
        setIsOpen(false);
    };
    
    const handleResetClick = () => {
        onReset();
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-neutral-300 hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-netflix-red transition-colors"
                aria-label="User Profile"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <UserIcon className="w-7 h-7" />
            </button>
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50 animate-zoom-in-fast"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                >
                    <ul className="py-1">
                        <li>
                            <button onClick={handleImportClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700" role="menuitem">
                                <UploadIcon className="w-5 h-5 mr-3" />
                                Import History
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
                        </li>
                        <li>
                            <button onClick={handleExportClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700" role="menuitem">
                                <DownloadIcon className="w-5 h-5 mr-3" />
                                Export History
                            </button>
                        </li>
                        <li>
                            <div className="my-1 border-t border-neutral-700"></div>
                        </li>
                        <li>
                            <button onClick={handleResetClick} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white transition-colors" role="menuitem">
                                <TrashIcon className="w-5 h-5 mr-3" />
                                Reset Site
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ProfileMenu;
