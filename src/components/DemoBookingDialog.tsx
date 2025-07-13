import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Users } from 'lucide-react';

interface DemoBookingDialogProps {
  children: React.ReactNode;
}

const DemoBookingDialog = ({ children }: DemoBookingDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '',
    preferredTime: '',
    requirements: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Demo Scheduled",
      description: "Thank you! We'll contact you within 24 hours to confirm your demo appointment.",
    });
    setFormData({ name: '', email: '', company: '', phone: '', teamSize: '', preferredTime: '', requirements: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Schedule Your Demo</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demo-name">Full Name *</Label>
              <Input
                id="demo-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email *</Label>
              <Input
                id="demo-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demo-company">Company *</Label>
              <Input
                id="demo-company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Your company name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-phone">Phone</Label>
              <Input
                id="demo-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demo-team-size">Team Size</Label>
              <Select value={formData.teamSize} onValueChange={(value) => handleSelectChange('teamSize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-5">1-5 people</SelectItem>
                  <SelectItem value="6-15">6-15 people</SelectItem>
                  <SelectItem value="16-50">16-50 people</SelectItem>
                  <SelectItem value="51-100">51-100 people</SelectItem>
                  <SelectItem value="100+">100+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-time">Preferred Time</Label>
              <Select value={formData.preferredTime} onValueChange={(value) => handleSelectChange('preferredTime', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9AM - 12PM EST)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12PM - 5PM EST)</SelectItem>
                  <SelectItem value="evening">Evening (5PM - 7PM EST)</SelectItem>
                  <SelectItem value="flexible">I'm flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="demo-requirements">Specific Requirements</Label>
            <Textarea
              id="demo-requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              placeholder="Tell us about your specific needs or what you'd like to see in the demo..."
              rows={3}
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">What to expect:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 30-minute personalized demo</li>
                  <li>• Live Q&A with our product expert</li>
                  <li>• Custom use case examples</li>
                  <li>• Pricing discussion if interested</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Schedule My Demo
            <Users className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DemoBookingDialog;