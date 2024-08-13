"use client";
import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';
import { move_window, Position } from "tauri-plugin-positioner-api";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { list } from 'postcss';

const Dropbox = () => {
  const [files, setFiles] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const fileDivRef = useRef(null);

  const handleDragStart = (event) => {
    console.log('Drag started');
    // Start dragging the file with its icon
    if (files.length > 0) {
      startDrag({ 
        item: [files[0].path], 
        icon: files[0].preview // Use the preview as the icon for dragging
      });
    }
  };

  const handleDragEnd = () => {
    console.log('Drag ended');
  };

  useEffect(() => {
    fileDivRef.current?.addEventListener('dragstart', handleDragStart);
    fileDivRef.current?.addEventListener('dragend', handleDragEnd);

    return () => {
      fileDivRef.current?.removeEventListener('dragstart', handleDragStart);
      fileDivRef.current?.removeEventListener('dragend', handleDragEnd);
    };
  }, [files]);

  useEffect(() => {
    move_window(Position.TopCenter); // Move the window to the top center
    
    const listenHoverDrop = listen('tauri://file-drop-hover', event => {
        console.log('Hovering over the window');
        setIsHovered(true);
    });

    const listenHoverLeave = listen('tauri://drag-leave', event => {
        console.log('Leaving the window');
        setIsHovered(false);
    });


    // Handle the Tauri `tauri://file-drop` event
    const unlisten = listen('tauri://file-drop', event => {
      const droppedFiles = event.payload;
      console.log(droppedFiles);

      // Extract icon path or set a default icon
      const iconPath = "/path/to/default/icon.png";

      // parse file name from path and set the files state
      let fileNames = droppedFiles.map(file => file.split('\\').pop().split('/').pop());  
        console.log(fileNames);

      setFiles(droppedFiles.map(file => ({
        name: file.split('\\').pop().split('/').pop(),
        path: file,
        preview: iconPath, // Assuming we use a default icon for now
      })));
    });

    // Enable the window to ignore cursor events by default
    // appWindow.setIgnoreCursorEvents(true);

    return () => {
      unlisten.then(fn => fn()); // Cleanup the listener
      listenHoverDrop.then(fn => fn());
        listenHoverLeave.then(fn => fn());
    //   appWindow.setIgnoreCursorEvents(false); // Reset on unmount
    };
  }, []); 

  return (
    <div
      className={`fixed top-0 left-1/2 transform -translate-x-1/2 w-[550px] h-[150px] ${
        isHovered ? 'bg-red-300/30' : 'bg-black'
      } bg-opacity-90 text-white flex items-center justify-center rounded-lg shadow-lg cursor-move z-50 transition-colors duration-300`}
    >
      <div className="p-4">
        {files.length <= 0 && ( <p className="text-center text-lg font-semibold">Drop files here</p> )}
        {files.length > 0 && (
          <div className="mt-4 grid grid-flow-row gap-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-white text-gray-900 p-4 rounded-lg shadow-md flex flex-col items-center justify-center"
                ref={fileDivRef}
              >
                <img 
                  src={file.preview} 
                  alt={file.name} 
                  className="h-16 w-16 rounded-full mb-2 object-cover" 
                />
                <p className="text-sm font-medium">{file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropbox;
