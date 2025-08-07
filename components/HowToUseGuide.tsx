

import React from 'react';
import { SearchIcon, FilmIcon, TvIcon, BookmarkIcon, ExternalLinkIcon, UploadIcon, PaletteIcon } from './Icons';

interface HowToUseGuideProps {
    onGoBack: () => void;
    isClosing?: boolean;
}

const HowToUseGuide: React.FC<HowToUseGuideProps> = ({ onGoBack, isClosing }) => {
    const animationClass = isClosing ? 'animate-genie-out' : 'animate-genie-in';
    
    return (
        <div className={`max-w-6xl mx-auto my-6 bg-neutral-900/50 p-4 sm:p-10 rounded-lg relative origin-[50%_-10rem] ${animationClass}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-netflix-red mb-6 text-center">Guide to Use This Site</h2>
            
            <section className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center">
                    <SearchIcon className="w-6 h-6 mr-3 text-netflix-red"/>
                    1. Search for Content
                </h3>
                <p className="text-neutral-300 ml-0 sm:ml-9">
                    Use the search bar at the top of the page to find any movie or TV show. As you type, results will appear below. Just click on a poster to get started.
                </p>
            </section>
            
            <section className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center">
                    <ExternalLinkIcon className="w-6 h-6 mr-3 text-netflix-red"/>
                    2. Generate Your Link
                </h3>
                <div className="ml-0 sm:ml-9 space-y-4">
                    <div className="bg-neutral-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg flex items-center mb-2"><FilmIcon className="w-5 h-5 mr-2"/>For Movies</h4>
                        <p className="text-neutral-300">
                            A modal will pop up showing the movie details. You'll instantly see the generated VidFast link, ready to be copied or opened.
                        </p>
                    </div>
                    <div className="bg-neutral-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg flex items-center mb-2"><TvIcon className="w-5 h-5 mr-2"/>For TV Shows</h4>
                        <p className="text-neutral-300">
                            The TV show modal lets you choose the exact season and episode you want to watch. The episode list provides details and preview images. As you select an episode, the link is updated automatically for you.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center">
                    <BookmarkIcon className="w-6 h-6 mr-3 text-netflix-red"/>
                    3. Save Your Progress
                </h3>
                <p className="text-neutral-300 ml-0 sm:ml-9 mb-4">
                    Tired of bookmarking links or forgetting which episode you were on? We've got you covered.
                </p>
                <div className="ml-0 sm:ml-9 bg-neutral-800 p-4 rounded-lg">
                    <p className="flex items-center text-white font-semibold mb-2">
                        <BookmarkIcon className="w-5 h-5 mr-2"/>
                        Open Link in New Tab & Save to Continue Watching
                    </p>
                    <p className="text-neutral-300">
                        Clicking this button opens the streaming link and adds the item to your "Continue Watching" list on the homepage. For TV shows, it saves the specific season and episode you selected.
                    </p>
                </div>
                 <div className="ml-0 sm:ml-9 bg-neutral-800 p-4 rounded-lg mt-4">
                    <p className="flex items-center text-white font-semibold mb-2">
                        <ExternalLinkIcon className="w-5 h-5 mr-2"/>
                        Open Link in New Tab (without saving to Continue Watching)
                    </p>
                    <p className="text-neutral-300">
                        If you just want to watch without saving, use this option. It will simply open the link without adding it to your list.
                    </p>
                </div>
            </section>

            <section className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center">
                    <UploadIcon className="w-6 h-6 mr-3 text-netflix-red"/>
                    4. Update from a Link
                </h3>
                <div className="ml-0 sm:ml-9 text-neutral-300 space-y-2">
                   <p>
                        The "Add or Update from Link" tool on the homepage is powerful. Paste any VidFast movie or episode link here.
                   </p>
                   <ul className="list-disc list-inside pl-2 space-y-1">
                       <li>If it's an item already in your list, it will update your progress (e.g., to the new episode number).</li>
                       <li>If it's a new item, it will ask for confirmation to add it to your list.</li>
                   </ul>
                </div>
            </section>

            <section className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center">
                    <PaletteIcon className="w-6 h-6 mr-3 text-netflix-red"/>
                    5. Customize Your Player Theme
                </h3>
                <p className="text-neutral-300 ml-0 sm:ml-9">
                    Personalize your viewing experience by changing the theme color of the VidFast player. Access the theme selector via the profile menu in the top-right corner. You can choose from presets or search for any color you like.
                </p>
            </section>

            <div className="text-center mt-10">
                <button 
                    onClick={onGoBack}
                    className="bg-netflix-red hover:bg-netflix-red-dark text-white font-bold py-3 px-8 rounded-md transition-colors text-lg"
                >
                    Got It, Go Back
                </button>
            </div>
        </div>
    );
}

export default HowToUseGuide;
