import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface StatsData {
  daterange: string;
  metrics: {
    'Conversion rate': string;
    Orders: string;
    Revenue: string;
    Visits: string;
  };
  shop: string;
  timestamp: string;
  trafficSource: {
    [key: string]: number;
  };
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  heading: {
    fontSize: '24px',
    marginBottom: '20px',
  },
  statsContainer: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
  },
  analysis: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: '1.6',
  },
  paragraph: {
    marginBottom: '15px',
  },
};

function EtsyAdsRecommendation({ customerId, isAdmin }: { customerId: string; isAdmin: boolean }) {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [indexBuilding, setIndexBuilding] = useState<boolean>(false);

  useEffect(() => {
    const fetchStatsData = async () => {
      console.log('Fetching stats data for customerId:', customerId);
      console.log('Is Admin:', isAdmin);
      
      if (!customerId && !isAdmin) {
        console.log('No customer selected.');
        setError('No customer selected.');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching customer document...');
        const customerDoc = await getDoc(doc(db, 'customers', customerId));
        if (!customerDoc.exists()) {
          console.log('Customer not found.');
          setError('Customer not found.');
          setLoading(false);
          return;
        }
        const customerData = customerDoc.data();
        const storeName = customerData.store_name;
        console.log('Store name:', storeName);

        console.log('Querying stats collection...');
        const statsCollection = collection(db, 'stats');
        const q = query(
          statsCollection,
          where('shop', '==', storeName),
          where('daterange', '>=', 'Last 30 Days:')
        );
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot:', querySnapshot);
        
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data() as StatsData;
          console.log('Fetched stats data:', data);
          setStatsData(data);
          await generateAnalysis(data);
        } else {
          console.log('No stats data found for store:', storeName);
          setError('No stats data found for this customer.');
        }
      } catch (err) {
        console.error('Error fetching stats data:', err);
        if (err instanceof Error && err.message.includes('index')) {
          setIndexBuilding(true);
          setError('The system is currently being optimized. Please try again in a few minutes.');
        } else {
          setError(`Failed to fetch stats data: ${err instanceof Error ? err.message : String(err)}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (customerId || isAdmin) {
      fetchStatsData();
    }
  }, [customerId, isAdmin]);

  const generateAnalysis = async (data: StatsData) => {
    try {
      const prompt = `
        Analyze the following Etsy store statistics for the last 30 days and provide recommendations for improving Etsy Ads performance:

        Date Range: ${data.daterange}
        Conversion Rate: ${data.metrics['Conversion rate']}
        Orders: ${data.metrics.Orders}
        Revenue: ${data.metrics.Revenue}
        Visits: ${data.metrics.Visits}

        Traffic Sources:
        ${Object.entries(data.trafficSource)
          .map(([source, count]) => `${source}: ${count}`)
          .join('\n')}

        Please provide a concise analysis of the store's performance over this period and specific recommendations for improving Etsy Ads effectiveness. Focus on key metrics and traffic sources that need improvement.

        Format your response with clear sections:
        1. Performance Summary
        2. Key Observations
        3. Recommendations for Improvement

        Use line breaks between sections and bullet points for lists.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });

      setAnalysis(response.choices[0].message.content || '');
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate analysis. Please try again later.');
    }
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((paragraph, index) => (
      <p key={index} style={styles.paragraph}>
        {paragraph}
      </p>
    ));
  };

  if (loading) {
    return <div>Loading Etsy Ads Recommendations...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        {indexBuilding && (
          <p>
            The database index is currently being built. This process usually takes a few minutes. 
            Please refresh the page or try again later.
          </p>
        )}
      </div>
    );
  }

  if (isAdmin && !customerId) {
    return <div>Please select a customer to view their Etsy Ads recommendations.</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Etsy Ads Recommendation</h2>
      {statsData && (
        <div style={styles.statsContainer}>
          <h3>Stats for {statsData.shop}</h3>
          <p>Date Range: {statsData.daterange}</p>
          <h4>Metrics:</h4>
          <ul>
            <li>Conversion Rate: {statsData.metrics['Conversion rate']}</li>
            <li>Orders: {statsData.metrics.Orders}</li>
            <li>Revenue: {statsData.metrics.Revenue}</li>
            <li>Visits: {statsData.metrics.Visits}</li>
          </ul>
          <h4>Traffic Sources:</h4>
          <ul>
            {Object.entries(statsData.trafficSource).map(([source, count]) => (
              <li key={source}>{source}: {count}</li>
            ))}
          </ul>
        </div>
      )}
      {analysis && (
        <div style={styles.analysis}>
          <h3>Analysis and Recommendations:</h3>
          {formatAnalysis(analysis)}
        </div>
      )}
    </div>
  );
}

export default EtsyAdsRecommendation;