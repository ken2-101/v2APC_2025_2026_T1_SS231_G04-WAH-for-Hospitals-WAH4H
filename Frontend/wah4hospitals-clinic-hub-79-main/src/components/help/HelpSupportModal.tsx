
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HelpSupportModalProps {
  children: React.ReactNode;
}

const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const { toast } = useToast();

  const faqs = [
    {
      question: "How do I register a new patient?",
      answer: "Navigate to the Patients tab and click 'Add New Patient'. Fill in the required information including personal details, contact information, and insurance details."
    },
    {
      question: "How do I submit a PhilHealth claim?",
      answer: "Go to the PhilHealth tab, select the patient, and click 'New Claim'. Fill in the claim details, attach required documents, and submit for processing."
    },
    {
      question: "How do I schedule appointments?",
      answer: "In the Appointments tab, click 'Schedule New Appointment'. Select the patient, doctor, date, and time. The system will check for conflicts automatically."
    },
    {
      question: "How do I access patient monitoring data?",
      answer: "Use the Monitoring tab to view real-time patient vitals, lab results, and medical history. You can filter by date, patient, or type of monitoring."
    },
    {
      question: "How do I manage inventory?",
      answer: "The Inventory tab allows you to track medical supplies, medications, and equipment. You can add new items, update quantities, and set low-stock alerts."
    },
    {
      question: "How do I generate reports?",
      answer: "Navigate to Statistics or use the ERP view for comprehensive reporting. You can generate patient reports, financial summaries, and compliance documents."
    }
  ];

  const quickGuides = [
    {
      title: "Getting Started",
      description: "Learn the basics of navigating WAH4Hospitals",
      icon: <Book className="w-5 h-5" />,
      topics: ["Dashboard Overview", "Navigation", "User Settings"]
    },
    {
      title: "Patient Management",
      description: "Complete guide to patient registration and records",
      icon: <FileText className="w-5 h-5" />,
      topics: ["Registration", "Medical Records", "Patient Search"]
    },
    {
      title: "Billing & Claims",
      description: "Handle billing and insurance claims efficiently",
      icon: <MessageCircle className="w-5 h-5" />,
      topics: ["PhilHealth Claims", "Billing Process", "Payment Tracking"]
    }
  ];

  const contactOptions = [
    {
      type: "Phone Support",
      value: "+63 2 8123-4567",
      icon: <Phone className="w-5 h-5" />,
      availability: "24/7 Emergency Support"
    },
    {
      type: "Email Support",
      value: "support@wah4hospitals.com",
      icon: <Mail className="w-5 h-5" />,
      availability: "Response within 24 hours"
    },
    {
      type: "Live Chat",
      value: "Available in-app",
      icon: <MessageCircle className="w-5 h-5" />,
      availability: "Mon-Fri 8AM-6PM"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate support ticket submission
    toast({
      title: "Support ticket submitted",
      description: `Your ticket #${Date.now().toString().slice(-6)} has been created. We'll get back to you soon!`
    });
    
    setSupportForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'medium'
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help & Support
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search frequently asked questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredFaqs.map((faq, index) => (
                  <Card key={index} className="cursor-pointer">
                    <CardHeader 
                      className="pb-3"
                      onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{faq.question}</CardTitle>
                        {selectedFaq === index ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </div>
                    </CardHeader>
                    {selectedFaq === index && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="guides" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="grid gap-4">
                {quickGuides.map((guide, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {guide.icon}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{guide.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{guide.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {guide.topics.map((topic, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Get in touch with our support team</h3>
                  <p className="text-gray-600">We're here to help you 24/7</p>
                </div>
                
                {contactOptions.map((option, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{option.type}</h4>
                          <p className="text-blue-600 font-medium">{option.value}</p>
                          <p className="text-sm text-gray-500">{option.availability}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="support" className="space-y-4">
            <ScrollArea className="h-96">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Support Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={supportForm.name}
                          onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={supportForm.email}
                          onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={supportForm.priority}
                        onChange={(e) => setSupportForm({...supportForm, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        rows={4}
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                        placeholder="Please describe your issue in detail..."
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Submit Support Ticket
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HelpSupportModal;
