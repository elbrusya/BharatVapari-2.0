import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Bot,
  User as UserIcon,
  Send,
  CheckCircle2,
  Sparkles,
  Loader2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QUESTIONS = [
  {
    id: 'job_types',
    question: "What type of opportunities are you looking for?",
    type: 'multi-select',
    options: ['Internship', 'Full-time', 'Part-time', 'Freelance'],
    field: 'job_types'
  },
  {
    id: 'preferred_domains',
    question: "Which domains interest you the most?",
    type: 'multi-select',
    options: [
      'Software Development',
      'Data Science & AI',
      'Product Management',
      'Design (UI/UX)',
      'Marketing',
      'Sales',
      'Operations',
      'Finance',
      'HR',
      'Content Writing'
    ],
    field: 'preferred_domains'
  },
  {
    id: 'experience_level',
    question: "What's your current experience level?",
    type: 'single-select',
    options: ['Student', 'Fresher', '1-3 years', '3-5 years', '5+ years'],
    field: 'experience_level',
    transform: (val) => val.toLowerCase().replace(' years', 'yrs').replace(' ', '')
  },
  {
    id: 'work_type',
    question: "What's your preferred work arrangement?",
    type: 'multi-select',
    options: ['Remote', 'On-site', 'Hybrid'],
    field: 'work_type'
  },
  {
    id: 'preferred_locations',
    question: "Which cities would you prefer to work in? (Skip if remote only)",
    type: 'text-multi',
    placeholder: "e.g., Bangalore, Mumbai, Delhi",
    field: 'preferred_locations',
    skippable: true
  },
  {
    id: 'salary',
    question: "What's your expected salary range? (Monthly in INR)",
    type: 'salary-range',
    fields: ['salary_min', 'salary_max'],
    placeholders: ['Min (e.g., 30000)', 'Max (e.g., 80000)']
  },
  {
    id: 'working_hours',
    question: "Do you prefer fixed or flexible working hours?",
    type: 'single-select',
    options: ['Fixed', 'Flexible'],
    field: 'working_hours',
    transform: (val) => val.toLowerCase()
  },
  {
    id: 'availability',
    question: "When can you start?",
    type: 'availability',
    options: ['Immediately', 'Within 15 days', 'Within 30 days', 'Within 60 days'],
    field: 'availability'
  },
  {
    id: 'hard_skills',
    question: "What are your key technical/hard skills?",
    type: 'text-multi',
    placeholder: "e.g., React, Python, Marketing, Figma",
    field: 'hard_skills'
  },
  {
    id: 'soft_skills',
    question: "What soft skills do you bring?",
    type: 'text-multi',
    placeholder: "e.g., Communication, Leadership, Problem Solving",
    field: 'soft_skills'
  },
  {
    id: 'career_goals',
    question: "What are your primary career goals?",
    type: 'multi-select',
    options: ['Learning-focused', 'Growth-focused', 'Income-focused', 'Work-life balance'],
    field: 'career_goals'
  },
  {
    id: 'bio',
    question: "Finally, tell us a bit about yourself and what you're passionate about!",
    type: 'textarea',
    placeholder: "Share your story, interests, and what drives you...",
    field: 'bio',
    skippable: true
  }
];

export default function AIPreferences() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({});
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your AI career assistant. I'll help you find the perfect opportunities by understanding your preferences. This will only take 2-3 minutes!`
    }
  ]);

  useEffect(() => {
    if (user?.role !== 'job_seeker') {
      toast.error('This feature is only for job seekers');
      navigate('/dashboard');
    }
    checkExistingPreferences();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkExistingPreferences = async () => {
    try {
      const response = await axios.get(`${API}/ai/job-seeker-preferences`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.exists && response.data.preferences.completed) {
        toast.info('You already have preferences saved. Redirecting to matches...');
        setTimeout(() => navigate('/ai-matches'), 2000);
      }
    } catch (error) {
      console.error('Error checking preferences:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { type, content }]);
  };

  const handleNext = async () => {
    const question = QUESTIONS[currentStep];

    // Validate
    if (question.type === 'multi-select' && selectedOptions.length === 0 && !question.skippable) {
      toast.error('Please select at least one option');
      return;
    }

    if (question.type === 'single-select' && selectedOptions.length === 0) {
      toast.error('Please select an option');
      return;
    }

    if (question.type === 'text-multi' && !textInput.trim() && !question.skippable) {
      toast.error('Please provide your answer');
      return;
    }

    if (question.type === 'salary-range' && (!salaryMin || !salaryMax)) {
      toast.error('Please provide both min and max salary');
      return;
    }

    if (question.type === 'textarea' && !textInput.trim() && !question.skippable) {
      toast.error('Please share a bit about yourself');
      return;
    }

    // Save answer
    let answer = '';
    let newPrefs = { ...preferences };

    if (question.type === 'multi-select' || question.type === 'single-select') {
      const values = selectedOptions.map(opt => 
        question.transform ? question.transform(opt) : opt.toLowerCase()
      );
      newPrefs[question.field] = question.type === 'single-select' ? values[0] : values;
      answer = selectedOptions.join(', ');
    } else if (question.type === 'text-multi') {
      const items = textInput.split(',').map(s => s.trim()).filter(s => s);
      newPrefs[question.field] = items;
      answer = items.join(', ');
    } else if (question.type === 'salary-range') {
      newPrefs.salary_min = parseInt(salaryMin);
      newPrefs.salary_max = parseInt(salaryMax);
      answer = `₹${parseInt(salaryMin).toLocaleString()} - ₹${parseInt(salaryMax).toLocaleString()}`;
    } else if (question.type === 'textarea') {
      newPrefs[question.field] = textInput;
      answer = textInput.length > 100 ? textInput.substring(0, 100) + '...' : textInput;
    } else if (question.type === 'availability') {
      const selected = selectedOptions[0];
      if (selected === 'Immediately') {
        newPrefs.availability = 'immediate';
      } else {
        newPrefs.availability = 'within_x_days';
        const days = selected.match(/\d+/)[0];
        newPrefs.availability_days = parseInt(days);
      }
      answer = selected;
    }

    setPreferences(newPrefs);

    // Add user message
    addMessage('user', answer);

    // Reset inputs
    setSelectedOptions([]);
    setTextInput('');
    setSalaryMin('');
    setSalaryMax('');

    // Move to next or complete
    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        addMessage('bot', QUESTIONS[currentStep + 1].question);
      }, 500);
    } else {
      // Complete
      await handleComplete(newPrefs);
    }
  };

  const handleSkip = () => {
    const question = QUESTIONS[currentStep];
    if (!question.skippable) return;

    addMessage('user', '(Skipped)');

    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        addMessage('bot', QUESTIONS[currentStep + 1].question);
      }, 500);
    } else {
      handleComplete(preferences);
    }
  };

  const handleComplete = async (finalPrefs) => {
    setIsSubmitting(true);

    try {
      finalPrefs.completed = true;

      await axios.post(
        `${API}/ai/job-seeker-preferences`,
        finalPrefs,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setShowCompletion(true);
      addMessage('bot', "🎉 Perfect! I've got everything I need. Let me find the best opportunities for you...");

      setTimeout(() => {
        navigate('/ai-matches');
      }, 3000);
    } catch (error) {
      toast.error('Failed to save preferences');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Remove last 2 messages (user answer and bot question)
      setMessages(prev => prev.slice(0, -2));
    }
  };

  const toggleOption = (option) => {
    const question = QUESTIONS[currentStep];
    if (question.type === 'single-select') {
      setSelectedOptions([option]);
    } else {
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter(o => o !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    }
  };

  if (!user) return null;

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Question {currentStep + 1} of {QUESTIONS.length}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="p-6 rounded-3xl border-2 border-slate-200 bg-white shadow-lg mb-6 max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'bot' 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600' 
                    : 'bg-gradient-to-br from-slate-600 to-slate-700'
                }`}>
                  {msg.type === 'bot' ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl ${
                    msg.type === 'bot'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Input Area */}
        {!showCompletion && (
          <Card className="p-6 rounded-3xl border-2 border-blue-200 bg-white shadow-lg">
            <div className="space-y-4">
              {/* Multi-select or Single-select */}
              {(currentQuestion.type === 'multi-select' || currentQuestion.type === 'single-select') && (
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      onClick={() => toggleOption(option)}
                      variant={selectedOptions.includes(option) ? 'default' : 'outline'}
                      className={`rounded-full ${
                        selectedOptions.includes(option)
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'border-2 border-slate-300 text-slate-700 hover:border-blue-600'
                      }`}
                    >
                      {selectedOptions.includes(option) && (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {/* Text Multi Input */}
              {currentQuestion.type === 'text-multi' && (
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                />
              )}

              {/* Salary Range */}
              {currentQuestion.type === 'salary-range' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder={currentQuestion.placeholders[0]}
                    className="rounded-xl"
                  />
                  <Input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder={currentQuestion.placeholders[1]}
                    className="rounded-xl"
                  />
                </div>
              )}

              {/* Textarea */}
              {currentQuestion.type === 'textarea' && (
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  rows={4}
                  className="rounded-xl"
                />
              )}

              {/* Availability */}
              {currentQuestion.type === 'availability' && (
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      onClick={() => setSelectedOptions([option])}
                      variant={selectedOptions.includes(option) ? 'default' : 'outline'}
                      className={`rounded-full ${
                        selectedOptions.includes(option)
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                          : 'border-2 border-slate-300 text-slate-700 hover:border-blue-600'
                      }`}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  variant="ghost"
                  className="text-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div className="flex gap-2">
                  {currentQuestion.skippable && (
                    <Button
                      type="button"
                      onClick={handleSkip}
                      variant="ghost"
                      className="text-slate-600"
                    >
                      Skip
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {currentStep === QUESTIONS.length - 1 ? 'Complete' : 'Next'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {showCompletion && (
          <Card className="p-8 rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Preferences Saved!
            </h2>
            <p className="text-slate-600">
              Finding your perfect matches...
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
