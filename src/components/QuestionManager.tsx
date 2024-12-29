import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Trash2, Plus, Save } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  duration: number;
}

const QuestionManager: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await window.fs.readFile('src/questions.json', { encoding: 'utf8' });
        const data = JSON.parse(response);
        setQuestions(data.questions);
        setLoading(false);
      } catch (error) {
        console.error('Error loading questions:', error);
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
      text: '',
      duration: 5000
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
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
      const data = { questions: questions };
      const jsonContent = JSON.stringify(data, null, 2);
      await window.fs.writeFile('src/questions.json', jsonContent);
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving questions:', error);
      setSaveStatus('Error saving questions');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            Loading questions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Question Manager</span>
          <div className="flex items-center gap-4">
            {saveStatus && (
              <span className={saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}>
                {saveStatus}
              </span>
            )}
            <Button 
              onClick={saveQuestions}
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-grow space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium min-w-8">#{question.id}</span>
                <Input
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                  placeholder="Enter question text"
                  className="flex-grow"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Duration (ms):</span>
                <Input
                  type="number"
                  value={question.duration}
                  onChange={(e) => updateQuestion(question.id, 'duration', e.target.value)}
                  className="w-32"
                  min="1000"
                  step="1000"
                />
              </div>
            </div>
            <Button
              onClick={() => removeQuestion(question.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        
        <Button 
          onClick={addQuestion}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add New Question
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuestionManager;