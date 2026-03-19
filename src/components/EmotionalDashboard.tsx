/**
 * EmotionalDashboard - Dashboard showing emotional connection system metrics and insights
 * Displays real-time emotional data, trust levels, and system performance
 */

import React, { useState, useEffect } from 'react';
import { useEmotionalConnection } from '../hooks/useEmotionalConnection';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { EmotionalDemoNavigation } from './EmotionalDemoNavigation';
import { 
  Heart, 
  Brain, 
  TrendingUp, 
  Clock, 
  MessageCircle, 
  BarChart3,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface EmotionalMetrics {
  trustLevel: number;
  interactionCount: number;
  averageResponseTime: number;
  emotionalStability: number;
  engagementScore: number;
  personalizationAccuracy: number;
}

export const EmotionalDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<EmotionalMetrics>({
    trustLevel: 0,
    interactionCount: 0,
    averageResponseTime: 0,
    emotionalStability: 0,
    engagementScore: 0,
    personalizationAccuracy: 0
  });

  const {
    session,
    isInitialized,
    trustLevel,
    interactionCount,
    currentEmotionalState,
    firstImpressionMetrics
  } = useEmotionalConnection({
    userId: 'dashboard-user',
    autoInitialize: true
  });

  const {
    dominantEmotion,
    emotionalIntensity,
    valence,
    arousal,
    emotionalHistory,
    emotionalTrends,
    interfaceAdaptations
  } = useEmotionalState(currentEmotionalState);

  // Update metrics when session data changes
  useEffect(() => {
    if (session) {
      setMetrics({
        trustLevel,
        interactionCount,
        averageResponseTime: 850, // Simulated average
        emotionalStability: calculateEmotionalStability(emotionalHistory),
        engagementScore: calculateEngagementScore(emotionalHistory),
        personalizationAccuracy: 0.85 // Simulated accuracy
      });
    }
  }, [session, trustLevel, interactionCount, emotionalHistory]);

  const calculateEmotionalStability = (history: any[]): number => {
    if (history.length < 2) return 1;
    
    const valences = history.map((h: any) => h.valence as number);
    const variance = valences.reduce((sum, val) => {
      const mean = valences.reduce((a, b) => a + b, 0) / valences.length;
      return sum + Math.pow(val - mean, 2);
    }, 0) / valences.length;
    
    return Math.max(0, 1 - variance);
  };

  const calculateEngagementScore = (history: any[]): number => {
    if (history.length === 0) return 0;
    
    const avgArousal = history.reduce((sum, h: any) => sum + (h.arousal as number), 0) / history.length;
    const avgIntensity = history.reduce((sum, h: any) => {
      const emotions = Object.values(h).slice(0, 9) as number[];
      return sum + Math.max(...emotions);
    }, 0) / history.length;
    
    return (avgArousal + avgIntensity) / 2;
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (value: number): string => {
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emotional dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <EmotionalDemoNavigation />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Emotional Connection Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time insights into emotional intelligence and user connection
            </p>
          </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Trust Level */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Trust Level</h3>
              </div>
              <span className={`text-2xl font-bold ${getMetricColor(trustLevel, { good: 0.7, warning: 0.4 })}`}>
                {Math.round(trustLevel * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(trustLevel)}`}
                style={{ width: `${trustLevel * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Based on oxytocin activation and reliability
            </p>
          </div>

          {/* Interaction Count */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Interactions</h3>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {interactionCount}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Active engagement</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total meaningful connections
            </p>
          </div>

          {/* Emotional Stability */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Emotional Stability</h3>
              </div>
              <span className={`text-2xl font-bold ${getMetricColor(metrics.emotionalStability, { good: 0.7, warning: 0.4 })}`}>
                {Math.round(metrics.emotionalStability * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.emotionalStability)}`}
                style={{ width: `${metrics.emotionalStability * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Consistency of emotional responses
            </p>
          </div>

          {/* Engagement Score */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Engagement Score</h3>
              </div>
              <span className={`text-2xl font-bold ${getMetricColor(metrics.engagementScore, { good: 0.6, warning: 0.3 })}`}>
                {Math.round(metrics.engagementScore * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.engagementScore)}`}
                style={{ width: `${metrics.engagementScore * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Arousal and intensity levels
            </p>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Avg Response Time</h3>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {metrics.averageResponseTime}ms
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target className="w-4 h-4 text-blue-500" />
              <span>Optimal timing</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Emotional response delivery
            </p>
          </div>

          {/* Personalization Accuracy */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900">Personalization</h3>
              </div>
              <span className={`text-2xl font-bold ${getMetricColor(metrics.personalizationAccuracy, { good: 0.8, warning: 0.6 })}`}>
                {Math.round(metrics.personalizationAccuracy * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.personalizationAccuracy)}`}
                style={{ width: `${metrics.personalizationAccuracy * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Adaptation accuracy
            </p>
          </div>
        </div>

        {/* Current Emotional State */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Current Emotional State
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Dominant Emotion:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {dominantEmotion}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Intensity:</span>
                <span className="font-medium text-gray-900">
                  {Math.round(emotionalIntensity * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valence:</span>
                <span className={`font-medium ${
                  valence > 0.3 ? 'text-green-600' : valence < -0.3 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {valence > 0 ? '+' : ''}{valence.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Arousal:</span>
                <span className="font-medium text-gray-900">
                  {Math.round(arousal * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trend:</span>
                <span className={`font-medium ${
                  emotionalTrends.direction === 'positive' ? 'text-green-600' : 
                  emotionalTrends.direction === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {emotionalTrends.trend} ({emotionalTrends.change > 0 ? '+' : ''}{emotionalTrends.change.toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Interface Adaptations
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Color Scheme:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {interfaceAdaptations.colorScheme}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Typography:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {interfaceAdaptations.typography}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Animation Level:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {interfaceAdaptations.animationLevel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Layout Density:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {interfaceAdaptations.layoutDensity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Emotional Indicators:</span>
                <span className={`font-medium ${
                  interfaceAdaptations.emotionalIndicators ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {interfaceAdaptations.emotionalIndicators ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* First Impression Metrics */}
        {firstImpressionMetrics && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              First Impression Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {firstImpressionMetrics.loadTime}ms
                </div>
                <p className="text-sm text-gray-600">Load Time</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(firstImpressionMetrics.visualAppealScore)}
                </div>
                <p className="text-sm text-gray-600">Visual Appeal</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(firstImpressionMetrics.cognitiveFluencyScore)}
                </div>
                <p className="text-sm text-gray-600">Cognitive Fluency</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(firstImpressionMetrics.overallImpression)}
                </div>
                <p className="text-sm text-gray-600">Overall Score</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
