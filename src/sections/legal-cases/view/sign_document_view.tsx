import '../../pdf-sign/App.css';

import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { toast, Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import {
  useGetLegalCase,
  useGetSigningAssets,
  useSaveSignedLegalCaseFileMutation,
} from 'src/hooks/customHooks';
import { GetLegalCaseFile_API } from 'src/apis/api';
import { useRouter } from 'src/routes/hooks';

import { PDFViewer } from 'src/sections/pdf-sign/components/pdf-viewer';
import { ProfileSigningBlocks } from 'src/sections/pdf-sign/components/profile-signing-blocks';
import { SimpleSignatureCanvas } from 'src/sections/pdf-sign/components/simple-signature-canvas';
import type { SignatureCanvasHandle } from 'src/sections/pdf-sign/components/simple-signature-canvas';
import type { SignatureItem } from 'src/sections/pdf-sign/components/pdf-viewer';
import { signPDF } from 'src/sections/pdf-sign/utils/pdfSigner';
import { ensurePdfFile } from 'src/sections/pdf-sign/utils/image-to-pdf';
import {
  getStoredSignature,
  isESignaturePlacement,
  readFileAsDataUrl,
  setStoredSignature,
  syncStoredSigningAssets,
} from 'src/sections/pdf-sign/utils/signing-assets';
import { LIST_BASE_PATHS, getListBasePath } from 'src/routes/case-paths';

type SignLocationState = {
  returnTo?: string;
};

function resolveReturnTo(stateReturnTo?: string) {
  if (stateReturnTo && LIST_BASE_PATHS.some((path) => stateReturnTo === path || stateReturnTo.startsWith(`${path}?`))) {
    return stateReturnTo;
  }
  const stored = sessionStorage.getItem('sign_return_to');
  if (stored && LIST_BASE_PATHS.some((path) => stored === path || stored.startsWith(`${path}?`))) {
    return stored;
  }
  return getListBasePath();
}

export function SignDocumentView() {
  const { id } = useParams();
  const router = useRouter();
  const location = useLocation();
  const locationState = (location.state || {}) as SignLocationState;
  const returnTo = resolveReturnTo(locationState.returnTo);

  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data } = useGetLegalCase({ key: 'GetLegalCase_API', id, setIsLoading });
  const legalCase = data?.data?.data;
  const { data: assetsResponse } = useGetSigningAssets({ key: 'GetSigningAssets_API' });
  const { mutateAsync: saveSignedFile } = useSaveSignedLegalCaseFileMutation({ setIsLoading });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [placementMode, setPlacementMode] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [pdfScale, setPdfScale] = useState<number>(1.2);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (locationState.returnTo) {
      sessionStorage.setItem('sign_return_to', locationState.returnTo);
    }
  }, [locationState.returnTo]);

  useEffect(() => {
    const assets = assetsResponse?.data?.assets;
    if (assets) {
      syncStoredSigningAssets(assets);
      const fromApi = assets.signature_url || null;
      setSignatureData(fromApi);
      if (fromApi) setPlacementMode(true);
      return;
    }
    const signature = getStoredSignature();
    setSignatureData(signature);
    if (signature) setPlacementMode(true);
  }, [assetsResponse]);

  useEffect(() => {
    if (!signatureData) return;
    setSignatures((prev) =>
      prev.map((item) => (isESignaturePlacement(item) ? { ...item, signatureData } : item))
    );
  }, [signatureData]);

  useEffect(() => {
    const loadPdf = async () => {
      if (!id || !legalCase) return;
      const filePath = legalCase.gon7a_file_path;
      if (!filePath) {
        setLoadError('لا يوجد ملف مرفق لهذه القضية.');
        return;
      }

      try {
        setLoadingPdf(true);
        setLoadError(null);
        const response = await GetLegalCaseFile_API({ id, type: 'gon7a' });
        const blob = response.data as Blob;
        const fileName = legalCase.gon7a_file_name || 'document.pdf';
        const rawFile = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
        setPdfFile(await ensurePdfFile(rawFile));
      } catch (error) {
        console.error(error);
        setLoadError('تعذر تحميل الملف. حاول مرة أخرى.');
      } finally {
        setLoadingPdf(false);
      }
    };

    loadPdf();
  }, [id, legalCase]);

  const handleRemoveSignature = (signatureId: string) => {
    setSignatures((prev) => prev.filter((sig) => sig.id !== signatureId));
  };

  const enableSignaturePlacement = () => {
    setPlacementMode(true);
  };

  const saveDrawnSignature = () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      toast.error('ارسم التوقيع أولاً.');
      return;
    }
    const dataUrl = canvasRef.current.getTransparentDataUrl();
    setStoredSignature(dataUrl);
    setSignatureData(dataUrl);
    setPlacementMode(true);
    toast.success('تم حفظ التوقيع');
  };

  const handleSignatureUpload = async (file?: File) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setStoredSignature(dataUrl);
    setSignatureData(dataUrl);
    setPlacementMode(true);
  };

  const hasPlacedESignature = signatures.some(isESignaturePlacement);

  const handleSaveSignedDocument = async () => {
    if (!pdfFile || !hasPlacedESignature || !id || !signatureData) {
      toast.error('ضع توقيعاً إلكترونياً واحداً على الأقل على الملف.');
      return;
    }

    setIsSigning(true);
    try {
      const signedPdfBytes = await signPDF(
        pdfFile,
        signatures,
        pdfScale,
        pageDimensions,
        canvasOffset ?? undefined,
        canvasSize ?? undefined,
        []
      );
      const signedFile = new File([new Uint8Array(signedPdfBytes) as BlobPart], 'signed-document.pdf', {
        type: 'application/pdf',
      });
      const form = new FormData();
      form.append('file', signedFile);
      form.append('file_type', 'gon7a');
      await saveSignedFile({ id, axiosdata: form });
      sessionStorage.removeItem('sign_return_to');
      router.push(returnTo);
    } catch (error) {
      console.error(error);
      toast.error('تعذر حفظ الملف الموقع.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <DashboardContent maxWidth={false} disablePadding>
      <Toaster richColors expand={false} duration={5000} />
      <Box className="generate-contract">
        <Box className="generate-contract-header">
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
            معاينة الملف والتوقيع الإلكتروني
          </Typography>
          <Button
            component={RouterLink}
            to={returnTo}
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="eva:arrow-back-fill" width={18} />}
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            العودة للقائمة
          </Button>
        </Box>

        {loadingPdf && !pdfFile ? (
          <Box
            className="generate-contract-pdf"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}
          >
            <CircularProgress />
          </Box>
        ) : loadError && !pdfFile ? (
          <Box className="generate-contract-panel-card" sx={{ mx: '10px' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
            <Button component={RouterLink} to={returnTo} variant="contained">
              العودة للقائمة
            </Button>
          </Box>
        ) : pdfFile ? (
          <Box className="generate-contract-workspace">
            <Box className="generate-contract-pdf">
              <PDFViewer
                file={pdfFile}
                layout="immersive"
                signatureData={signatureData}
                signatures={signatures}
                onSignaturesChange={setSignatures}
                placementMode={placementMode && Boolean(signatureData)}
                onPlacementModeChange={setPlacementMode}
                onScaleChange={setPdfScale}
                onPageDimensionsChange={setPageDimensions}
                onCanvasOffsetChange={setCanvasOffset}
                onCanvasSizeChange={setCanvasSize}
              />
            </Box>

            <Box className="generate-contract-panel">
              <Box className="generate-contract-panel-card">
                <Typography className="generate-contract-file-name">{pdfFile.name}</Typography>
              </Box>

              <Box className="generate-contract-panel-card">
                <Typography sx={{ fontWeight: 700, mb: 1.25, color: '#1B2A3A' }}>رسم التوقيع</Typography>
                <SimpleSignatureCanvas ref={canvasRef} height={180} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5, mb: 2 }}>
                  <button type="button" className="place-signature-button" onClick={saveDrawnSignature}>
                    حفظ التوقيع
                  </button>
                  <button type="button" className="add-signature-button" onClick={() => canvasRef.current?.clear()}>
                    مسح
                  </button>
                  <Button component="label" size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                    رفع صورة التوقيع
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      onChange={(event) => {
                        handleSignatureUpload(event.target.files?.[0]);
                        event.target.value = '';
                      }}
                    />
                  </Button>
                </Box>

                <ProfileSigningBlocks
                  signaturePreview={signatureData}
                  placementMode={placementMode}
                  onEnableSignature={enableSignaturePlacement}
                />

                {placementMode && signatureData && (
                  <Typography
                    component="p"
                    className="placement-hint-text"
                    sx={{ color: '#1e40af', fontWeight: 600, mb: 1.5, fontSize: 13 }}
                  >
                    انقر في أي مكان على الملف لوضع التوقيع
                  </Typography>
                )}

                {signatures.length > 0 && (
                  <Box className="signatures-list">
                    <Typography
                      variant="h4"
                      component="h4"
                      sx={{ margin: '0 0 12px 0', color: '#374151', fontSize: '15px', fontWeight: 600 }}
                    >
                      التوقيعات الموضوعة ({signatures.length})
                    </Typography>
                    <Box className="signatures-list-items">
                      {signatures.map((sig, index) => (
                        <Box key={sig.id} className="signature-list-item">
                          <Typography component="span" sx={{ fontSize: 13 }}>
                            توقيع {index + 1} - صفحة {sig.position.pageNumber}
                          </Typography>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature(sig.id)}
                            className="remove-signature-button"
                            title="حذف التوقيع"
                          >
                            ×
                          </button>
                        </Box>
                      ))}
                    </Box>
                    <button
                      type="button"
                      onClick={enableSignaturePlacement}
                      className="add-signature-button"
                      disabled={!signatureData}
                    >
                      + إضافة توقيع آخر
                    </button>
                  </Box>
                )}
              </Box>

              <Box className="generate-contract-panel-card download-section">
                <Typography variant="body2" sx={{ mb: 1.5, color: '#4B5563', textAlign: 'center', fontSize: 13 }}>
                  احفظ الملف بعد وضع التوقيع الإلكتروني عليه.
                </Typography>
                <button
                  type="button"
                  onClick={handleSaveSignedDocument}
                  disabled={!hasPlacedESignature || isSigning || !signatureData || isLoading}
                  className="download-button"
                >
                  {isSigning ? (
                    <>
                      <span className="spinner" />
                      جاري حفظ الملف الموقع...
                    </>
                  ) : (
                    <>
                      <Iconify icon="solar:diskette-bold" width={20} />
                      حفظ الملف الموقع
                    </>
                  )}
                </button>
              </Box>
            </Box>
          </Box>
        ) : null}
      </Box>
    </DashboardContent>
  );
}
