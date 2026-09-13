import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { HealthFile } from "../../types";
import { CameraModal } from "../common/CameraModal";
import { Modal } from "../common/Modal";
import {
  FolderOpen,
  Upload,
  Camera,
  Trash2,
  Eye,
  Download,
  FileText,
  FileCheck,
  Plus,
  Loader2,
  Tag,
  AlertCircle,
} from "lucide-react";

export const PatientFiles: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<HealthFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileCategory, setFileCategory] = useState<HealthFile["category"]>("Prescription");
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Preview file modal state
  const [previewFile, setPreviewFile] = useState<HealthFile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchFiles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dbService.getPatientFiles(user.id);
      setFiles(data);
    } catch (err) {
      console.error("Error loading files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!fileName) {
      setFileName(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (_blob: Blob, base64Url: string) => {
    setSelectedFileBase64(base64Url);
    if (!fileName) {
      setFileName(`Prescription_Photo_${new Date().toISOString().slice(0, 10)}`);
    }
    setIsUploadModalOpen(true);
  };

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFileBase64) return;
    if (!fileName.trim()) {
      alert("Please provide a file name");
      return;
    }

    setIsUploading(true);
    try {
      const newFile: Omit<HealthFile, "id" | "created_at"> = {
        patient_id: user.id,
        patient_name: user.name,
        title: fileName.trim(),
        file_name: fileName.trim(),
        file_url: selectedFileBase64,
        category: fileCategory,
        upload_date: new Date().toISOString().slice(0, 10),
      };

      await dbService.uploadPatientFile(newFile);
      await fetchFiles();
      setIsUploadModalOpen(false);
      setSelectedFileBase64(null);
      setFileName("");
    } catch (err) {
      console.error("Error saving file:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingId(id);
    try {
      await dbService.deletePatientFile(id);
      await fetchFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Upload Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FolderOpen className="w-6 h-6 text-cyan-600" />
            <span>My Files & Lab Documents</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Secure storage for blood tests, radiology scans, prescription scans, and health records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsCameraOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Camera className="w-4 h-4 text-cyan-600" />
            <span>Scan Document</span>
          </button>
          <button
            onClick={() => {
              setSelectedFileBase64(null);
              setFileName("");
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-1.5 transition-transform active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your files...</div>
      ) : files.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No medical files uploaded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload diagnostic reports, lab results, discharge summaries, or previous prescriptions.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First File</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-cyan-500 transition-all group"
            >
              <div className="space-y-2">
                <div className="relative aspect-4/3 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                  {file.file_url.startsWith("data:image") ? (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-slate-400" />
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold">
                    {file.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={file.file_name}>
                    {file.file_name}
                  </h3>
                  <p className="text-[11px] text-slate-500">Uploaded {file.upload_date}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 rounded-lg flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  disabled={deletingId === file.id}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Capture Modal with Pre-Permission prompt */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        onSwitchToUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Upload File Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Medical Document"
        maxWidth="md"
      >
        <form onSubmit={handleSaveUpload} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Document Title *</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Blood Lipid Profile Nov 2026"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Category</label>
            <select
              value={fileCategory}
              onChange={(e) => setFileCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="Prescription">Prescription</option>
              <option value="Lab Report">Lab Report</option>
              <option value="X-Ray">X-Ray / Radiology</option>
              <option value="Scan">CT / MRI Scan</option>
              <option value="Discharge Summary">Discharge Summary</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          {/* Select File */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Select Image / File *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFileBase64 ? (
              <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-slate-900 border border-slate-800 flex items-center justify-center">
                <img
                  src={selectedFileBase64}
                  alt="Selected file"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-slate-900/90 text-white text-xs font-semibold rounded-lg"
                >
                  Change File
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl flex flex-col items-center justify-center text-center space-y-2 text-slate-500 hover:text-cyan-700 transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-semibold">Click to select photo or document</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFileBase64}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Save to My Files</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview File Modal */}
      <Modal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.file_name || "Document Preview"}
        maxWidth="2xl"
      >
        {previewFile && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[500px] border border-slate-800 p-2">
              <img
                src={previewFile.file_url}
                alt={previewFile.file_name}
                className="w-full max-h-[480px] object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>
                Category: <span className="font-semibold text-slate-800">{previewFile.category}</span> &bull;{" "}
                Uploaded {previewFile.upload_date}
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
