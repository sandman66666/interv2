interface Window {
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<any>;
      writeFile: (path: string, content: string) => Promise<void>;
    };
  }
  
  declare module '*.json' {
    const value: any;
    export default value;
  }