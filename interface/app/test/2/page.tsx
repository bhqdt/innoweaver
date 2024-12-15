"use client";

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const UserPage = ({ userData }) => {
  const {
    userQuery,
    keywords,
    authors,
    journals,
    topics
  } = userData;

  const topicsData = {
    labels: topics.slice(0, 10), // 仅展示前10个兴趣话题
    datasets: [
      {
        label: 'Topic Frequency',
        data: topics.slice(0, 10).map((_, idx) => 1), // 每个话题出现一次，条形图数据
        backgroundColor: '#FF5722',
        borderColor: '#E64A19',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary min-h-screen p-8 ml-[12.5rem]">
      <h1 className="text-4xl font-bold text-text-primary mb-8">User Profile</h1>

      {/* User Query */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">User Query</h2>
        <p className="text-text-secondary">{userQuery}</p>
      </section>

      {/* Keywords */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Keywords</h2>
        <div className="flex flex-wrap gap-4">
          {keywords.map((keyword, index) => (
            <span key={index} className="bg-secondary text-text-primary py-1 px-3 rounded-lg">{keyword}</span>
          ))}
        </div>
      </section>

      {/* Authors */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Authors</h2>
        <div className="flex flex-wrap gap-4">
          {authors.map((author, index) => (
            <span key={index} className="bg-secondary text-text-primary py-1 px-3 rounded-lg">{author}</span>
          ))}
        </div>
      </section>

      {/* Journals */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Journals</h2>
        <div className="flex flex-wrap gap-4">
          {journals.map((journal, index) => (
            <span key={index} className="bg-secondary text-text-primary py-1 px-3 rounded-lg">{journal}</span>
          ))}
        </div>
      </section>

      {/* Interest Topics */}
      {/* <section className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Interest Topics</h2>
        <ul className="list-disc pl-6 text-text-secondary space-y-2">
          {topics.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      </section> */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Interest Topics</h2>
        <div className="w-full max-w-4xl h-96">
          <Bar data={topicsData} options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Top 10 Interest Topics',
              },
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Topics',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Frequency',
                },
                beginAtZero: true,
              },
            }
          }} 
          style={{
            width: '100%', // 使图表宽度占满容器
            maxWidth: '800px', // 最大宽度
            height: '400px', // 设置高度
            margin: '0 auto', // 居中显示
            borderRadius: '10px', // 圆角
          }}
          />
        </div>
      </section>
    </div>
  );
};

// 示例用户数据，传递给组件的props
const userData = {
  userQuery: 'The user wears the MagKnitic haptic textile garment during an interactive game. As they engage with the game, the AI adjusts the haptic feedback in response to their movements, providing sensations that enhance their gameplay experience. The user enjoys a deeper connection to the game as they receive tactile feedback that is personalized and responsive to their actions.',
  keywords: ['feedback', 'design', 'haptics', 'haptic', 'reality', 'fabrication', 'texture', 'customization', 'perception', 'accessibility'],
  authors: ['Holsti, Liisa', 'H', 'Somanath, Sowmya', 'Kraley, Michael', 'Wu, Shanel', 'Voida, Stephen', 'Tentori, Monica', 'Niklaus, Aleena Gertrudes', 'Chen, Mike Y.', 'Gabriel, Lily M'],
  journals: ["CHI '24", "UbiComp/ISWC '23 Adjunct", "UIST '23", "CSCW '23 Companion"],
  topics: [
    'Engaging in dialogues for informational support, emotional support, and appraisal support',
    'Users participating in mixed-reality (MR) gaming experiences',
    'Users seeking personalized conversational experiences with agent personas',
    'Exploring artworks in virtual museums using voice-controlled interactions',
    'Virtual reality applications that require realism in object weight during tasks such as construction, fitness training, and interactive gaming.',
    'XR and haptic designers',
    'Practicing calligraphy writing in the absence of a teacher.',
    'Individuals engaging in aquatic activities',
    'Utilizing augmented reality (AR) to perform home-based exercises that engage users and promote physical activity.',
    'Individuals seeking interactive and tactile feedback in wearable devices and textiles',
    // 添加更多兴趣话题...
  ]
};

const App = () => (
  <UserPage userData={userData} />
);

export default App;
