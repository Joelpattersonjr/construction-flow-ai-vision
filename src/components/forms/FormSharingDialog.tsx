import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Download, Mail, Share2, QrCode, Code } from 'lucide-react';
import { toast } from 'sonner';

interface FormSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formName: string;
}

export const FormSharingDialog: React.FC<FormSharingDialogProps> = ({
  open,
  onOpenChange,
  formId,
  formName,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const publicUrl = `${window.location.origin}/public/forms/${formId}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  useEffect(() => {
    if (open) {
      generateQRCode();
    }
  }, [open, formId]);

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${formName}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded!');
  };

  const sendEmail = async () => {
    if (!emailRecipient) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // This would typically call an edge function to send email
      // For now, we'll open the default email client
      const subject = encodeURIComponent(`Form: ${formName}`);
      const body = encodeURIComponent(`
Hello,

You've been invited to fill out the form: "${formName}"

You can access the form using this link:
${publicUrl}

Or scan the QR code that's been shared with you.

Best regards
`);
      
      window.open(`mailto:${emailRecipient}?subject=${subject}&body=${body}`);
      toast.success('Email client opened with form link');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Form: {formName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Public Form Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Share this link with anyone</Label>
                  <div className="flex gap-2">
                    <Input value={publicUrl} readOnly />
                    <Button
                      onClick={() => copyToClipboard(publicUrl, 'Link')}
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This link can be accessed by anyone without login requirements.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {isGeneratingQR ? (
                    <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                      <p>Generating QR code...</p>
                    </div>
                  ) : (
                    qrCodeDataUrl && (
                      <img
                        src={qrCodeDataUrl}
                        alt="Form QR Code"
                        className="w-64 h-64 border rounded-lg"
                      />
                    )
                  )}
                  <div className="flex gap-2">
                    <Button onClick={downloadQRCode} disabled={!qrCodeDataUrl}>
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(publicUrl, 'QR Code URL')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Users can scan this QR code to access the form directly.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send via Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                  />
                </div>
                <Button onClick={sendEmail} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <p className="text-sm text-muted-foreground">
                  This will open your default email client with a pre-filled message.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Embed Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>HTML Embed Code</Label>
                  <div className="flex gap-2">
                    <Input value={embedCode} readOnly className="font-mono text-sm" />
                    <Button
                      onClick={() => copyToClipboard(embedCode, 'Embed code')}
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="border rounded bg-background p-2">
                    <iframe
                      src={publicUrl}
                      width="100%"
                      height="200"
                      frameBorder="0"
                      title="Form Preview"
                      className="rounded"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy this HTML code to embed the form in any website.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};