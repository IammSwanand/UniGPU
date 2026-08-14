import React, { createContext, useContext, useState } from 'react';

const WorkloadContext = createContext();

export function WorkloadProvider({ children }) {
  const [selectedGPU, setSelectedGPU] = useState('');
  const [script, setScript] = useState(null);
  const [scriptText, setScriptText] = useState('');
  const [scriptPreview, setScriptPreview] = useState(false);
  const [reqs, setReqs] = useState(null);
  const [reqText, setReqText] = useState('');
  const [reqPreview, setReqPreview] = useState(false);
  const [dataset, setDataset] = useState(null);

  const resetWorkload = () => {
    setSelectedGPU('');
    setScript(null);
    setScriptText('');
    setScriptPreview(false);
    setReqs(null);
    setReqText('');
    setReqPreview(false);
    setDataset(null);
  };

  return (
    <WorkloadContext.Provider value={{
      selectedGPU, setSelectedGPU,
      script, setScript,
      scriptText, setScriptText,
      scriptPreview, setScriptPreview,
      reqs, setReqs,
      reqText, setReqText,
      reqPreview, setReqPreview,
      dataset, setDataset,
      resetWorkload
    }}>
      {children}
    </WorkloadContext.Provider>
  );
}

export function useWorkload() {
  return useContext(WorkloadContext);
}
