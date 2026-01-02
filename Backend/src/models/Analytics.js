const mongoose = require('mongoose');

/**
 * Analytics Schema for tracking document and query metrics
 */
const analyticsSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  response: {
    type: String,
    required: true
  },
  documentsAccessed: [{
    fileId: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    pages: [Number],
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true
  },
  userSatisfaction: {
    type: Number, // 1-5 rating
    min: 1,
    max: 5,
    default: null
  },
  topics: [{
    topic: String,
    confidence: Number
  }],
  citations: {
    count: {
      type: Number,
      default: 0
    },
    sources: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
analyticsSchema.index({ sessionId: 1, timestamp: -1 });
analyticsSchema.index({ 'documentsAccessed.fileId': 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ query: 'text', timestamp: -1 });

// Virtual for formatted date
analyticsSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toISOString().split('T')[0];
});

// Static methods for analytics queries
analyticsSchema.statics.getDocumentAnalytics = function(timeRange = '7d') {
  const dateFilter = getDateFilter(timeRange);
  
  return this.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    { $unwind: '$documentsAccessed' },
    {
      $group: {
        _id: '$documentsAccessed.fileId',
        fileName: { $first: '$documentsAccessed.fileName' },
        accessCount: { $sum: 1 },
        avgRelevanceScore: { $avg: '$documentsAccessed.relevanceScore' },
        uniqueQueries: { $addToSet: '$query' },
        uniqueSessions: { $addToSet: '$sessionId' },
        pagesAccessed: { $push: '$documentsAccessed.pages' }
      }
    },
    {
      $project: {
        _id: 0,
        fileId: '$_id',
        fileName: 1,
        accessCount: 1,
        avgRelevanceScore: { $round: ['$avgRelevanceScore', 3] },
        uniqueQueryCount: { $size: '$uniqueQueries' },
        uniqueSessionCount: { $size: '$uniqueSessions' },
        totalPageReferences: { $sum: { $size: '$pagesAccessed' } }
      }
    },
    { $sort: { accessCount: -1 } }
  ]);
};

analyticsSchema.statics.getTopicAnalytics = function(timeRange = '7d') {
  const dateFilter = getDateFilter(timeRange);
  
  return this.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    { $unwind: '$topics' },
    {
      $group: {
        _id: '$topics.topic',
        totalMentions: { $sum: 1 },
        avgConfidence: { $avg: '$topics.confidence' },
        uniqueDocuments: { $addToSet: '$documentsAccessed.fileId' },
        avgResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $project: {
        _id: 0,
        topic: '$_id',
        totalMentions: 1,
        avgConfidence: { $round: ['$avgConfidence', 3] },
        uniqueDocumentCount: { $size: '$uniqueDocuments' },
        avgResponseTime: { $round: ['$avgResponseTime', 0] }
      }
    },
    { $sort: { totalMentions: -1 } }
  ]);
};

analyticsSchema.statics.getUsageMetrics = function(timeRange = '7d') {
  const dateFilter = getDateFilter(timeRange);

  return this.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    {
      $group: {
        _id: null,
        totalQueries: { $sum: 1 },
        uniqueUsers: { $addToSet: '$sessionId' },
        avgResponseTime: { $avg: '$responseTime' },
        uniqueDocuments: { $addToSet: '$documentsAccessed.fileId' },
        citationsProvided: { $sum: '$citations.count' },
        avgSatisfaction: { $avg: '$userSatisfaction' }
      }
    },
    {
      $project: {
        _id: 0,
        totalQueries: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        avgResponseTime: { $round: ['$avgResponseTime', 0] },
        uniqueDocumentCount: { $size: '$uniqueDocuments' },
        totalCitations: 1,
        avgSatisfaction: { $round: ['$avgSatisfaction', 2] }
      }
    }
  ]);
};

analyticsSchema.statics.getHourlyUsage = function(timeRange = '7d') {
  const dateFilter = getDateFilter(timeRange);
  
  return this.aggregate([
    { $match: { timestamp: { $gte: dateFilter } } },
    {
      $group: {
        _id: {
          hour: { $hour: '$timestamp' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        queryCount: { $sum: 1 },
        uniqueUsers: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        hour: '$_id.hour',
        queryCount: 1,
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    { $sort: { date: 1, hour: 1 } }
  ]);
};

function getDateFilter(timeRange) {
  const now = new Date();
  const filters = {
    '1d': new Date(now - 24 * 60 * 60 * 1000),
    '7d': new Date(now - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now - 90 * 24 * 60 * 60 * 1000)
  };
  
  return filters[timeRange] || filters['7d'];
}

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
