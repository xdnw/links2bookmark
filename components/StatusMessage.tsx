import React from 'react';

type StatusMessageProps = {
  message: string | null;
};

const StatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
  if (!message) return null;
  
  const isError = message.startsWith("Error");
  
  return (
    <p className={`my-2 font-medium border rounded px-2 w-fit mx-auto ${
      isError 
        ? "border-red-500 text-red-600 dark:text-red-500" 
        : "border-emerald-500 text-emerald-600 dark:text-emerald-500"
    }`}>
      {message}
    </p>
  );
};

export default React.memo(StatusMessage);