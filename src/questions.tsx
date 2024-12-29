import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Trash2, Plus, Save, Home } from 'lucide-react';
import questionsData from './questions.json';

interface Question {
  id: number;
  text: string;
  duration: number;
}

const QuestionEditor = () => {
  const [questions, setQuestions] = useState<Question[]>(questionsData.questions);
  const [saveStatus, setSaveStatus] = useState('');

  const addQuestion = () => {
    const newQuestion: Question = {
      id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
      text: '',
      duration: 5000
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: number, field: keyof Question, value: string | number) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return { 
          ...q, 
          [field]: field === 'duration' ? parseInt(value as string) || 0 : value 
        };
      }
      return q;
    }));
  };

  const saveQuestions = async () => {
    try {
      setSaveStatus('Saving...');
      const data = { questions: [...questions].sort((a, b) => a.id - b.id) };
      const jsonContent = JSON.stringify(data, null, 2);
      console.log('Saving content:', jsonContent);
      await window.fs.writeFile('./src/questions.json', jsonContent);
      setSaveStatus('✓ Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving questions:', error);
      setSaveStatus('❌ Error saving questions');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Questions Editor</h1>
              <p className="text-sm text-gray-500 mt-1">{questions.length} questions configured</p>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Back to App
              </a>
              <button
                onClick={saveQuestions}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
          {saveStatus && (
            <div className={`mt-4 p-3 rounded-md ${
              saveStatus.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-500">#{question.id}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text
                      </label>
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        rows={3}
                        placeholder="Enter the question text..."
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (ms)
                        </label>
                        <input
                          type="number"
                          value={question.duration}
                          onChange={(e) => updateQuestion(question.id, 'duration', e.target.value)}
                          min="1000"
                          step="1000"
                          className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        />
                      </div>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-6 h-6" />
          <span>Add New Question</span>
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<QuestionEditor />);