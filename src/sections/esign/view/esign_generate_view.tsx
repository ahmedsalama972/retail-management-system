import '../../pdf-sign/App.css';

import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { toast, Toaster } from 'sonner';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { PDFUpload } from 'src/components/file-upload/pdf-upload';
import TextInputComponent from 'src/components/utils/TextInputComponent';
import { useRouter } from 'src/routes/hooks';
import {
  useGetSigningAssets,
  useSaveSigningSignatureMutation,
  useUploadEsignLibraryMutation,
} from 'src/hooks/customHooks';
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

export function EsignGenerateView() {
  const router = useRouter();
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ documentName, setDocumentName ] = useState('');
  const [ pendingFile, setPendingFile ] = useState<File | null>(null);
  const [ pdfFile, setPdfFile ] = useState<File | null>(null);
  const [ signatureData, setSignatureData ] = useState<string | null>(null);
  const [ signatures, setSignatures ] = useState<SignatureItem[]>([]);
  const [ placementMode, setPlacementMode ] = useState(false);
  const [ isSigning, setIsSigning ] = useState(false);
  const [ pdfScale, setPdfScale ] = useState(1.2);
  const [ pageDimensions, setPageDimensions ] = useState<{ width: number; height: number } | null>(null);
  const [ canvasOffset, setCanvasOffset ] = useState<{ x: number; y: number } | null>(null);
  const [ canvasSize, setCanvasSize ] = useState<{ width: number; height: number } | null>(null);

  const { mutateAsync: uploadLibrary } = useUploadEsignLibraryMutation({
    setIsLoading,
    onSuccess: () => router.push('/esign/library'),
  });
  const { mutate: saveAssetSignature } = useSaveSigningSignatureMutation({});
  const { data: assetsResponse } = useGetSigningAssets({ key: 'GetSigningAssets_API' });

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
  }, [ assetsResponse ]);

  useEffect(() => {
    if (!signatureData) return;
    setSignatures((prev) =>
      prev.map((item) => (isESignaturePlacement(item) ? { ...item, signatureData } : item))
    );
  }, [ signatureData ]);

  const saveDrawnSignature = () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      toast.error('ارسم التوقيع أولاً.');
      return;
    }
    const dataUrl = canvasRef.current.getTransparentDataUrl();
    setStoredSignature(dataUrl);
    setSignatureData(dataUrl);
    setPlacementMode(true);
    // Persist to API — toast comes from mutation onSuccess
    saveAssetSignature({ image: dataUrl, kind: 'drawn' });
  };

  const handleSignatureUpload = async (file?: File) => {
    if (!file) return;
    try {
      // Prefer multipart file upload (more reliable than huge JSON data URLs)
      const form = new FormData();
      form.append('file', file);
      const dataUrl = await readFileAsDataUrl(file);
      setStoredSignature(dataUrl);
      setSignatureData(dataUrl);
      setPlacementMode(true);
      saveAssetSignature(form);
    } catch (error) {
      console.error(error);
      toast.error('تعذر قراءة ملف التوقيع');
    }
  };

  const handleStartWithDocument = async () => {
    const name = documentName.trim();
    if (!name) {
      toast.error('أدخل اسم المستند أولاً');
      return;
    }
    if (!pendingFile) {
      toast.error('ارفع الملف أولاً');
      return;
    }
    const ready = await ensurePdfFile(pendingFile);
    setPdfFile(ready);
    setDocumentName(name);
  };

  const handleSave = async () => {
    if (!pdfFile) {
      toast.error('ارفع ملف PDF أولاً');
      return;
    }
    const hasSig = signatures.some(isESignaturePlacement);
    if (!hasSig || !signatureData) {
      toast.error('ضع توقيعاً إلكترونياً واحداً على الأقل');
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
      const signedFile = new File([ new Uint8Array(signedPdfBytes) as BlobPart ], 'signed-document.pdf', {
        type: 'application/pdf',
      });
      const form = new FormData();
      form.append('file', signedFile);
      form.append('document_name', documentName || pdfFile.name);
      await uploadLibrary(form);
    } catch (error) {
      console.error(error);
      toast.error('تعذر حفظ المستند');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <DashboardContent maxWidth={false} disablePadding>
      {isLoading && null}
      <Toaster richColors expand={false} duration={5000} style={{ zIndex: 20000 }} position="top-center" />
      <Box className={`generate-contract${!pdfFile ? ' generate-contract--upload' : ''}`}>
        <Box className="generate-contract-header">
          <Box>

          </Box>
          <Button
            component={RouterLink}
            to="/esign/library"
            variant="outlined"
            size="small"
            endIcon={<Iconify icon="eva:arrow-back-fill" width={18} />}
            sx={{ borderRadius: 2, fontWeight: 700, flexShrink: 0, mt: 2 }}
          >
            العودة للمكتبة
          </Button>
        </Box>

        {!pdfFile ? (
          <Box className="esign-upload-screen">
            <Box className="esign-upload-card">
              <Typography className="esign-upload-card__title">رفع مستند جديد</Typography>
              <Typography className="esign-upload-card__subtitle">
                أدخل اسم المستند وقم برفع الملف لبدء إجراءات التوقيع
              </Typography>

              <Box className="esign-upload-card__field">
                <TextInputComponent
                  name="اسم المستند *"
                  type="text"
                  value={documentName}
                  refState={(e: any) => setDocumentName(e.target.value)}
                />
                <Typography className="esign-upload-card__hint">
                  مثال: ملف تمويل ومرابحة عقارية
                </Typography>
              </Box>

              <Box className="esign-upload-card__field">
                <Typography className="esign-upload-card__label">
                  الملف <Box component="span" sx={{ color: '#DC2626' }}>*</Box>
                </Typography>
                <Box className="esign-upload-card__dropzone">
                  <PDFUpload
                    accept="application/pdf,image/*"
                    selectedFileName={pendingFile?.name || null}
                    onFileSelect={(file) => {
                      setPendingFile(file);
                      if (!documentName.trim()) {
                        setDocumentName(file.name.replace(/\.[^.]+$/, ''));
                      }
                    }}
                  />
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleStartWithDocument}
                startIcon={<Iconify icon="solar:cloud-upload-bold-duotone" width={20} />}
                sx={{
                  mt: 1,
                  py: 1.35,
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: '0 10px 24px rgba(26, 41, 66, 0.28)',
                }}
              >
                رفع المستند والبدء
              </Button>
            </Box>

            <Box className="esign-upload-footer">
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E' }} />
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                  اتصال آمن ومشفّر (SSL 256-bit)
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
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
                <TextInputComponent
                  name="اسم المستند"
                  type="text"
                  value={documentName}
                  refState={(e: any) => setDocumentName(e.target.value)}
                />
              </Box>
              <Box className="generate-contract-panel-card">
                <Typography sx={{ fontWeight: 700, mb: 1.25 }}>رسم التوقيع</Typography>
                <SimpleSignatureCanvas ref={canvasRef} height={180} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                  <button type="button" className="place-signature-button" onClick={saveDrawnSignature}>
                    حفظ التوقيع
                  </button>
                  <button type="button" className="place-signature-button" onClick={() => setPlacementMode(true)}>
                    وضع التوقيع
                  </button>
                </Box>
                <Button component="label" size="small" variant="outlined" sx={{ textTransform: 'none', mt: 1 }}>
                  رفع صورة التوقيع
                  <input
                    hidden
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    onChange={(event) => {
                      handleSignatureUpload(event.target.files?.[ 0 ]);
                      event.target.value = '';
                    }}
                  />
                </Button>
                <ProfileSigningBlocks
                  signaturePreview={signatureData}
                  placementMode={placementMode}
                  onEnableSignature={() => setPlacementMode(true)}
                />
              </Box>
              <Box className="generate-contract-panel-card download-section">
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={isSigning}
                  onClick={handleSave}
                  startIcon={<Iconify icon="eva:save-fill" />}
                >
                  {isSigning ? 'جاري الحفظ...' : 'حفظ الملف الموقّع'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </DashboardContent>
  );
}
