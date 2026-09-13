import React, { useState, useRef, useEffect } from "react";
import { Modal } from "./Modal";
import {
  Camera,
  RotateCw,
  Check,
  X,
  AlertCircle,
  Upload,
  Video,
  ShieldAlert,
  Sparkles,
  FileImage,
} from "lucide-react";
import { generateSampleParchaBase64 } from "../../lib/sampleParcha";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob, base64Url: string) => void;
  onSwitchToUpload?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onSwitchToUpload,
}) => {
  const [hasPermissionPrompted, setHasPermissionPrompted] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks when closing
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setCapturedImage(null);
      setErrorMsg(null);
      setHasPermissionPrompted(false);
      setPermissionGranted(false);
    }
  }, [isOpen]);

  const requestCameraAccess = async (deviceId?: string) => {
    setErrorMsg(null);
    setHasPermissionPrompted(true);

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Camera access is not supported in this browser environment. You can upload a photo or try our sample prescription parcha.");
      setPermissionGranted(false);
      return;
    }

    try {
      stopStream();

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn("Video play notice:", err));
      }

      // Enumerate other cameras
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          setAvailableDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        } catch (e) {
          // Ignore enumeration warning
        }
      }
    } catch (err: any) {
      console.warn("Camera access status:", err?.name, err?.message);
      let message = "Camera permission was dismissed or is restricted. You can upload an image or use our sample parcha.";
      const errName = err?.name || "";
      const errMsg = err?.message || "";

      if (
        errName === "NotAllowedError" ||
        errName === "PermissionDeniedError" ||
        errName === "PermissionDismissedError" ||
        errMsg.toLowerCase().includes("dismissed") ||
        errMsg.toLowerCase().includes("denied")
      ) {
        message = "Camera permission was dismissed or blocked by the browser. You can upload a prescription photo or use the sample parcha below.";
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        message = "No physical camera was found on this device. Please upload a photo from your files.";
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        message = "Camera is currently in use by another application.";
      }
      setErrorMsg(message);
      setPermissionGranted(false);
    }
  };

  const handleUseSampleParcha = () => {
    const sampleBase64 = generateSampleParchaBase64();
    if (!sampleBase64) return;

    // Convert dataUrl to Blob
    const arr = sampleBase64.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });

    onCapture(blob, sampleBase64);
    onClose();
  };

  const handleFallbackFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      onCapture(file, base64Url);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  // Re-attach video stream if videoRef is mounted
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedImage]);

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    // Freeze stream
    stopStream();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    requestCameraAccess(selectedDeviceId);
  };

  const handleConfirmParcha = () => {
    if (!capturedImage) return;

    // Convert dataUrl to Blob
    const arr = capturedImage.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });

    onCapture(blob, capturedImage);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prescription / Parcha Scanner" maxWidth="2xl">
      <div className="space-y-4">
        {/* Hidden Fallback File Input */}
        <input
          ref={fallbackFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFallbackFileSelect}
          className="hidden"
        />

        {/* Step 1: Pre-permission Notice */}
        {!hasPermissionPrompted && (
          <div className="text-center py-6 px-4 space-y-4">
            <div className="w-14 h-14 bg-cyan-50 text-cyan-700 rounded-2xl flex items-center justify-center mx-auto border border-cyan-100 shadow-sm">
              <Camera className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">Allow Camera Access</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                MedCare needs access to your camera to photograph a handwritten prescription or clinic parcha.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                id="btn-allow-camera-permission"
                onClick={() => requestCameraAccess()}
                className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Allow Camera</span>
              </button>
              <button
                id="btn-use-sample-parcha-pre"
                onClick={handleUseSampleParcha}
                className="w-full sm:w-auto px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Try Sample Parcha</span>
              </button>
              <button
                id="btn-deny-camera-permission"
                onClick={() => {
                  onClose();
                  if (onSwitchToUpload) {
                    onSwitchToUpload();
                  } else {
                    fallbackFileInputRef.current?.click();
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                Upload File
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Error State */}
        {hasPermissionPrompted && errorMsg && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-start space-x-3 text-amber-900">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <h4 className="text-sm font-semibold">Camera Access Notice</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                id="btn-use-sample-parcha-error"
                onClick={handleUseSampleParcha}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Sample Prescription (Instant Demo)</span>
              </button>
              <button
                id="btn-switch-upload-fallback"
                onClick={() => {
                  if (onSwitchToUpload) {
                    onClose();
                    onSwitchToUpload();
                  } else {
                    fallbackFileInputRef.current?.click();
                  }
                }}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload From Files</span>
              </button>
              <button
                id="btn-retry-camera"
                onClick={() => requestCameraAccess()}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors"
              >
                Try Camera Again
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Active Camera View */}
        {hasPermissionPrompted && permissionGranted && !capturedImage && (
          <div className="space-y-3">
            {availableDevices.length > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-medium">Selected Camera:</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    requestCameraAccess(e.target.value);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  {availableDevices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Prescription Alignment Guide Frame */}
              <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-cyan-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                <div className="text-[11px] text-cyan-300 font-semibold bg-slate-900/80 backdrop-blur px-2 py-1 rounded w-max">
                  Align Handwritten Prescription Inside Border
                </div>
                <div className="text-[10px] text-slate-300 text-right bg-slate-900/80 backdrop-blur px-2 py-1 rounded self-end">
                  Keep lighting even
                </div>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleUseSampleParcha}
                  className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Use Sample</span>
                </button>
                <button
                  id="btn-capture-parcha-frame"
                  onClick={handleCaptureFrame}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-cyan-600/30 flex items-center space-x-2 transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Parcha</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Captured Preview Confirmation */}
        {capturedImage && (
          <div className="space-y-3">
            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-200">
              <img
                src={capturedImage}
                alt="Captured prescription parcha"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Parcha Captured</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                id="btn-retake-parcha"
                onClick={handleRetake}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                id="btn-use-this-parcha"
                onClick={handleConfirmParcha}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Use This Parcha</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
