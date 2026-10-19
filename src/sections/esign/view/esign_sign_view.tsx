import '../../pdf-sign/App.css';

import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { toast, Toaster } from 'sonner';
import axios from 'axios';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { useGetEsignDocument, useGetSigningAssets, useSignEsignShareMutation } from 'src/hooks/customHooks';
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
import { fileUrl } from 'src/sections/legal-cases/utils';

export function EsignSignView() {
  const { id } = useParams();
  const router = useRouter();
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data } = useGetEsignDocument({ key: 'GetEsignDocument_API', kind: 'share', id, setIsLoading });
  const doc = data?.data?.data;
  const { data: assetsResponse } = useGetSigningAssets({ key: 'GetSigningAssets_API' });
  const { mutateAsync: signShare } = useSignEsignShareMutation({
    setIsLoading,
    onSuccess: () => router.push('/esign/contracts'),
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [placementMode, setPlacementMode] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    const load = async () => {
      const isSignedDoc =
        Boolean(doc?.signed) ||
        ['signed', 'returned', 'confirmed'].includes(String(doc?.status || ''));
      // Prefer the signed PDF when the share is already signed; otherwise the original.
      const preferredPath = isSignedDoc
        ? doc?.signed_file_path || doc?.signed_file_url || doc?.file_url || doc?.file_path
        : doc?.file_url || doc?.file_path;
      if (!preferredPath) return;
      try {
        setLoadError(null);
        const url = fileUrl(preferredPath);
        const response = await axios.get(url, {
          responseType: 'blob',
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
        });
        const blob = response.data as Blob;
        const rawFile = new File([blob], `${doc.contractname || 'document'}.pdf`, {
          type: blob.type || 'application/pdf',
        });
        setPdfFile(await ensurePdfFile(rawFile));
      } catch (error) {
        console.error(error);
        setLoadError('تعذر تحميل الملف');
      }
    };
    load();
  }, [doc]);

  const saveDrawnSignature = () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) {
      toast.error('ارسم التوقيع أولاً.');
      return;
    }
    const dataUrl = canvasRef.current.getTransparentDataUrl();
    setStoredSignature(dataUrl);
    setSignatureData(dataUrl);
    setPlacementMode(true);
  };

  const handleSignatureUpload = async (file?: File) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setStoredSignature(dataUrl);
    setSignatureData(dataUrl);
    setPlacementMode(true);
  };

  const handleSign = async () => {
    if (!pdfFile || !id || !signatures.some(isESignaturePlacement) || !signatureData) {
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
      const signedFile = new File([new Uint8Array(signedPdfBytes) as BlobPart], 'signed-document.pdf', {
        type: 'application/pdf',
      });
      const form = new FormData();
      form.append('file', signedFile);
      await signShare({ id, formData: form });
    } catch (error) {
      console.error(error);
      toast.error('تعذر حفظ التوقيع');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <DashboardContent maxWidth={false} disablePadding>
      {isLoading && null}
      <Toaster richColors expand={false} duration={5000} />
      <Box className="generate-contract">
        <Box className="generate-contract-header">
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {doc?.signed || ['signed', 'returned', 'confirmed'].includes(String(doc?.status || ''))
              ? 'عرض المستند الموقع'
              : 'توقيع الملف'}
          </Typography>
          <Button component={RouterLink} to="/esign/contracts" variant="outlined" size="small">
            العودة
          </Button>
        </Box>

        {loadError && (
          <Alert severity="error" sx={{ m: 2 }}>
            {loadError}
          </Alert>
        )}

        {!pdfFile && !loadError && (
          <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 320, alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        )}

        {pdfFile && (
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
                <Typography className="generate-contract-file-name">
                  {doc?.contractname || doc?.document_name || pdfFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  من: {doc?.company_name || '-'}
                </Typography>
              </Box>
              <Box className="generate-contract-panel-card">
                <Typography sx={{ fontWeight: 700, mb: 1.25 }}>رسم التوقيع</Typography>
                <SimpleSignatureCanvas ref={canvasRef} height={180} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                  <button type="button" className="place-signature-button" onClick={saveDrawnSignature}>
                    حفظ التوقيع
                  </button>
                  <Button component="label" size="small" variant="outlined" sx={{ textTransform: 'none' }}>
                    رفع صورة
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
                  onEnableSignature={() => setPlacementMode(true)}
                />
              </Box>
              <Box className="generate-contract-panel-card download-section">
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={isSigning || Boolean(doc?.signed)}
                  onClick={handleSign}
                  startIcon={<Iconify icon="eva:edit-2-fill" />}
                >
                  {isSigning ? 'جاري التوقيع...' : 'تأكيد التوقيع'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </DashboardContent>
  );
}
