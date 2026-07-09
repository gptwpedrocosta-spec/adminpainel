import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, X, Check, FileUp } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value: string; // Base64 string or URL
  onChange: (base64: string) => void;
  onClear?: () => void;
  type?: 'avatar' | 'document';
  id?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  onClear,
  type = 'avatar',
  id = 'file-upload'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg('');
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Apenas arquivos de imagem são permitidos (.jpg, .jpeg, .png, .webp).');
      return;
    }

    // Check size (limit to 2MB for firestore compatibility and fast loading)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('A imagem é muito grande. O limite máximo é de 2MB para garantir a segurança e carregamento rápido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        onChange(base64);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Falha ao ler o arquivo. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isBase64 = value && value.startsWith('data:image/');
  const hasValue = !!value;

  return (
    <div className="space-y-1.5" id={`${id}-container`}>
      <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">{label}</label>
      
      {errorMsg && (
        <div className="text-[10px] text-rose-500 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-100 animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      {hasValue ? (
        <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 group flex flex-col items-center justify-center p-3">
          {type === 'avatar' ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-300 shadow-sm bg-slate-200 shrink-0">
              <img 
                src={value} 
                alt="Upload preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video max-h-40 rounded-lg overflow-hidden border border-slate-300 bg-slate-900">
              <img 
                src={value} 
                alt="Upload preview" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[9.5px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1">
              <Check size={10} />
              <span>Salvo com Proteção</span>
            </span>
            
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-lg transition-all text-[9px] font-bold flex items-center gap-1"
                title="Remover imagem"
              >
                <X size={10} />
                <span>Excluir</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragActive 
              ? 'border-amber-400 bg-amber-50/20 shadow-xs' 
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />

          <div className={`p-3 rounded-xl mb-2.5 transition-colors ${
            dragActive ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-500'
          }`}>
            {type === 'avatar' ? <ImageIcon size={20} /> : <FileUp size={20} />}
          </div>

          <p className="text-[11px] font-bold text-slate-700 leading-normal">
            Arraste e solte {type === 'avatar' ? 'a foto' : 'o documento'} aqui ou <span className="text-amber-500 underline hover:text-amber-600">clique para buscar</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">
            PNG, JPG ou WEBP de até 2MB
          </p>
        </div>
      )}
    </div>
  );
};
