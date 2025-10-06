import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Link, useNavigate } from 'react-router-dom';

function IAFlowchart() {
  const navigate = useNavigate();
  const [iaData, setIaData] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [selectedNodeName, setSelectedNodeName] = useState(null);
  const [inputText, setInputText] = useState('');
  // Removed aiResponse and setAiResponse state
  const [legendPosition, setLegendPosition] = useState({ x: 80, y: 200 });
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef();
  const zoomRef = useRef();
  const gRef = useRef();



  const templates = useMemo(() => ({
    'e-commerce': {
      name: 'E-commerce Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'Landing page with featured products and promotions' },
        {
          name: 'Browse Products',
          type: 'action',
          description: 'User browses product categories and lists',
          children: [
            { name: 'Product Details', type: 'page', description: 'Detailed view of a selected product with images, specs, and reviews' }
          ]
        },
        { name: 'Shopping Cart', type: 'page', description: 'View and manage products added to cart' },
        {
          name: 'Checkout',
          type: 'action',
          label: 'Proceed to payment',
          description: 'User enters shipping and billing information'
        },
        {
          name: 'Login Required?',
          type: 'decision',
          description: 'Check if user is logged in before checkout',
          children: [
            {
              name: 'Authentication Page',
              type: 'page',
              description: 'User authentication flow',
              children: [
                {
                  name: 'Sign Up',
                  type: 'action',
                  children: [
                    { name: 'Input Personal Info', type: 'action', description: 'User inputs personal information' },
                    { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                    { name: 'OTP Verified', type: 'decision', children: [
                      { name: 'Home Page', type: 'page', description: 'User redirected after successful sign up' }
                    ] }
                  ]
                },
                {
                  name: 'Sign Up with Google',
                  type: 'action',
                  description: 'User signs up using Google OAuth',
                  children: [
                    { name: 'Home Page', type: 'page', description: 'User redirected after successful Google sign up' }
                  ]
                },
                {
                  name: 'Login',
                  type: 'action',
                  children: [
                    { name: 'Enter Email and Password', type: 'action', description: 'User enters login credentials' },
                    { name: 'Login Success', type: 'decision', children: [
                      { name: 'Home Page', type: 'page', description: 'User redirected after successful login' }
                    ] },
                    { name: 'Forget Password', type: 'action', children: [
                      { name: 'Enter Email', type: 'action', description: 'User enters email for password reset' },
                      { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                      { name: 'OTP Verified', type: 'decision', children: [
                        { name: 'Set New Password', type: 'action', description: 'User sets a new password' },
                        { name: 'Home Page', type: 'page', description: 'User redirected after password reset' }
                      ] }
                    ] }
                  ]
                }
              ]
            },
            { name: 'Guest Checkout', type: 'page', linkType: 'related', label: 'Alternative path', description: 'Checkout without account' }
          ]
        },
        {
          name: 'Payment Method',
          type: 'decision',
          description: 'User selects payment method',
          children: [
            { name: 'Credit Card', type: 'page', label: 'Choose Card', description: 'Enter credit card details securely' },
            { name: 'PayPal', type: 'action', label: 'Redirect to PayPal', description: 'Redirect to PayPal for payment authorization' }
          ]
        },
        { name: 'Order Confirmation', type: 'page', description: 'Order summary and confirmation details' },
        { name: 'User Profile', type: 'page', linkType: 'related', description: 'User account management and order history' }
      ]
    },
    'portfolio': {
      name: 'Portfolio Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'Introduction and overview' },
        { name: 'About Me', type: 'page', description: 'Personal bio and background' },
        {
          name: 'Projects',
          type: 'page',
          description: 'Showcase of projects with details',
          children: [
            { name: 'Project 1', type: 'page', description: 'Details and media for project 1' },
            { name: 'Project 2', type: 'page', description: 'Details and media for project 2' }
          ]
        },
        { name: 'Contact', type: 'page', description: 'Contact form and social links' },
        { name: 'Blog', type: 'page', linkType: 'related', description: 'Articles and updates' },
        {
          name: 'Admin Login Required?',
          type: 'decision',
          description: 'Check if admin is logged in for editing',
          children: [
            {
              name: 'Authentication Page',
              type: 'page',
              description: 'Admin authentication flow',
              children: [
                {
                  name: 'Sign Up',
                  type: 'action',
                  children: [
                    { name: 'Input Personal Info', type: 'action', description: 'User inputs personal information' },
                    { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                    { name: 'OTP Verified', type: 'decision', children: [
                      { name: 'Admin Dashboard', type: 'page', description: 'User redirected after successful sign up' }
                    ] }
                  ]
                },
                {
                  name: 'Sign Up with Google',
                  type: 'action',
                  description: 'User signs up using Google OAuth',
                  children: [
                    { name: 'Admin Dashboard', type: 'page', description: 'User redirected after successful Google sign up' }
                  ]
                },
                {
                  name: 'Login',
                  type: 'action',
                  children: [
                    { name: 'Enter Email and Password', type: 'action', description: 'User enters login credentials' },
                    { name: 'Login Success', type: 'decision', children: [
                      { name: 'Admin Dashboard', type: 'page', description: 'User redirected after successful login' }
                    ] },
                    { name: 'Forget Password', type: 'action', children: [
                      { name: 'Enter Email', type: 'action', description: 'User enters email for password reset' },
                      { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                      { name: 'OTP Verified', type: 'decision', children: [
                        { name: 'Set New Password', type: 'action', description: 'User sets a new password' },
                        { name: 'Admin Dashboard', type: 'page', description: 'User redirected after password reset' }
                      ] }
                    ] }
                  ]
                }
              ]
            },
            { name: 'Public View', type: 'page', linkType: 'related', label: 'Alternative path', description: 'View portfolio without login' }
          ]
        }
      ]
    },
    'blog': {
      name: 'Blog Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'Latest posts and featured content' },
        {
          name: 'Posts List',
          type: 'page',
          description: 'List of blog posts',
          children: [
            { name: 'Single Post', type: 'page', description: 'Full content of a single blog post' }
          ]
        },
        {
          name: 'Categories',
          type: 'decision',
          description: 'Filter posts by category',
          children: [
            { name: 'Technology', type: 'page', description: 'Posts about technology' },
            { name: 'Design', type: 'page', description: 'Posts about design' },
            { name: 'Lifestyle', type: 'page', description: 'Posts about lifestyle' }
          ]
        },
        { name: 'About', type: 'page', description: 'About the blog and author' },
        {
          name: 'Login Required?',
          type: 'decision',
          description: 'Check if user is logged in for commenting',
          children: [
            {
              name: 'Authentication Page',
              type: 'page',
              description: 'User authentication flow',
              children: [
                {
                  name: 'Sign Up',
                  type: 'action',
                  children: [
                    { name: 'Input Personal Info', type: 'action', description: 'User inputs personal information' },
                    { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                    { name: 'OTP Verified', type: 'decision', children: [
                      { name: 'Comments Section', type: 'action', description: 'User redirected after successful sign up to comment' }
                    ] }
                  ]
                },
                {
                  name: 'Sign Up with Google',
                  type: 'action',
                  description: 'User signs up using Google OAuth',
                  children: [
                    { name: 'Comments Section', type: 'action', description: 'User redirected after successful Google sign up to comment' }
                  ]
                },
                {
                  name: 'Login',
                  type: 'action',
                  children: [
                    { name: 'Enter Email and Password', type: 'action', description: 'User enters login credentials' },
                    { name: 'Login Success', type: 'decision', children: [
                      { name: 'Comments Section', type: 'action', description: 'User redirected after successful login to comment' }
                    ] },
                    { name: 'Forget Password', type: 'action', children: [
                      { name: 'Enter Email', type: 'action', description: 'User enters email for password reset' },
                      { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                      { name: 'OTP Verified', type: 'decision', children: [
                        { name: 'Set New Password', type: 'action', description: 'User sets a new password' },
                        { name: 'Comments Section', type: 'action', description: 'User redirected after password reset to comment' }
                      ] }
                    ] }
                  ]
                }
              ]
            },
            { name: 'Guest Comments', type: 'action', linkType: 'related', label: 'Alternative path', description: 'Comment without account' }
          ]
        }
      ]
    },
    'restaurant': {
      name: 'Restaurant Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'Welcome and featured dishes' },
        { name: 'Menu', type: 'page', description: 'Full menu with categories' },
        {
          name: 'Browse Dishes',
          type: 'action',
          description: 'User browses dishes by category',
          children: [
            { name: 'Dish Details', type: 'page', description: 'Details and ingredients of a dish' }
          ]
        },
        {
          name: 'Login Required?',
          type: 'decision',
          description: 'Check if user is logged in before ordering',
          children: [
            {
              name: 'Authentication Page',
              type: 'page',
              description: 'User authentication flow',
              children: [
                {
                  name: 'Sign Up',
                  type: 'action',
                  children: [
                    { name: 'Input Personal Info', type: 'action', description: 'User inputs personal information' },
                    { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                    { name: 'OTP Verified', type: 'decision', children: [
                      { name: 'Order Online', type: 'decision', description: 'Choose order type after sign up' }
                    ] }
                  ]
                },
                {
                  name: 'Sign Up with Google',
                  type: 'action',
                  description: 'User signs up using Google OAuth',
                  children: [
                    { name: 'Order Online', type: 'decision', description: 'Choose order type after Google sign up' }
                  ]
                },
                {
                  name: 'Login',
                  type: 'action',
                  children: [
                    { name: 'Enter Email and Password', type: 'action', description: 'User enters login credentials' },
                    { name: 'Login Success', type: 'decision', children: [
                      { name: 'Order Online', type: 'decision', description: 'Choose order type after login' }
                    ] },
                    { name: 'Forget Password', type: 'action', children: [
                      { name: 'Enter Email', type: 'action', description: 'User enters email for password reset' },
                      { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                      { name: 'OTP Verified', type: 'decision', children: [
                        { name: 'Set New Password', type: 'action', description: 'User sets a new password' },
                        { name: 'Order Online', type: 'decision', description: 'Choose order type after password reset' }
                      ] }
                    ] }
                  ]
                }
              ]
            },
            { name: 'Order as Guest', type: 'decision', linkType: 'related', label: 'Alternative path', description: 'Order without account' }
          ]
        },
        {
          name: 'Order Online',
          type: 'decision',
          description: 'Choose order type',
          children: [
            { name: 'Dine In', type: 'page', label: 'Reserve table', description: 'Table reservation system' },
            { name: 'Takeaway', type: 'action', label: 'Quick order', description: 'Order for pickup or delivery' }
          ]
        },
        { name: 'Reservations', type: 'page', description: 'Manage reservations' },
        { name: 'Contact', type: 'page', linkType: 'related', description: 'Contact information and form' },
        { name: 'Reviews', type: 'page', description: 'Customer reviews and ratings' }
      ]
    },
    'university': {
      name: 'University Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'University overview and news' },
        {
          name: 'Admissions',
          type: 'decision',
          description: 'Admission process options',
          children: [
            { name: 'Apply Online', type: 'action', description: 'Online application form' },
            { name: 'Visit Campus', type: 'page', linkType: 'related', description: 'Campus visit scheduling' }
          ]
        },
        { name: 'Courses', type: 'page', description: 'Course catalog and details' },
        {
          name: 'Enroll',
          type: 'action',
          description: 'Enrollment process',
          children: [
            { name: 'Course Details', type: 'page', description: 'Detailed course information' }
          ]
        },
        { name: 'Library', type: 'page', description: 'Library resources and search' },
        { name: 'Resources', type: 'page', linkType: 'related', description: 'Student resources and support' },
        { name: 'Contact', type: 'page', description: 'Contact information' }
      ]
    },
    'banking app': {
      name: 'Banking App',
      type: 'page',
      children: [
        {
          name: 'Login Required?',
          type: 'decision',
          description: 'Check if user is logged in before accessing dashboard',
          children: [
            {
              name: 'Authentication Page',
              type: 'page',
              description: 'User authentication flow',
              children: [
                {
                  name: 'Sign Up',
                  type: 'action',
                  children: [
                    { name: 'Input Personal Info', type: 'action', description: 'User inputs personal information' },
                    { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                    { name: 'OTP Verified', type: 'decision', children: [
                      { name: 'Dashboard', type: 'page', description: 'User redirected after successful sign up' }
                    ] }
                  ]
                },
                {
                  name: 'Sign Up with Google',
                  type: 'action',
                  description: 'User signs up using Google OAuth',
                  children: [
                    { name: 'Dashboard', type: 'page', description: 'User redirected after successful Google sign up' }
                  ]
                },
                {
                  name: 'Login',
                  type: 'action',
                  children: [
                    { name: 'Enter Email and Password', type: 'action', description: 'User enters login credentials' },
                    { name: 'Login Success', type: 'decision', children: [
                      { name: 'Dashboard', type: 'page', description: 'User redirected after successful login' }
                    ] },
                    { name: 'Forget Password', type: 'action', children: [
                      { name: 'Enter Email', type: 'action', description: 'User enters email for password reset' },
                      { name: 'Enter OTP Code', type: 'action', description: 'User enters OTP code for verification' },
                      { name: 'OTP Verified', type: 'decision', children: [
                        { name: 'Set New Password', type: 'action', description: 'User sets a new password' },
                        { name: 'Dashboard', type: 'page', description: 'User redirected after password reset' }
                      ] }
                    ] }
                  ]
                }
              ]
            },
            { name: 'Guest Access', type: 'page', linkType: 'related', label: 'Alternative path', description: 'Access without login' }
          ]
        },
        { name: 'Dashboard', type: 'page', description: 'Account overview and summary' },
        {
          name: 'Transfer Funds',
          type: 'decision',
          description: 'Choose transfer type',
          children: [
            { name: 'Internal Transfer', type: 'action', description: 'Transfer between user accounts' },
            { name: 'External Transfer', type: 'page', label: 'To other banks', description: 'Transfer to external accounts' }
          ]
        },
        { name: 'Account Details', type: 'page', description: 'Detailed account information' },
        { name: 'Support', type: 'page', linkType: 'related', description: 'Customer support and FAQs' },
        { name: 'Transactions', type: 'page', description: 'Transaction history and statements' }
      ]
    },
    'social media': {
      name: 'Social Media Platform',
      type: 'page',
      children: [
        { name: 'Login', type: 'action', description: 'User login and registration' },
        { name: 'Feed', type: 'page', description: 'User posts and updates' },
        {
          name: 'Create Post',
          type: 'action',
          description: 'Post creation workflow',
          children: [
            { name: 'Add Media', type: 'page', description: 'Upload images or videos' },
            { name: 'Post Options', type: 'decision', description: 'Privacy and tagging options' }
          ]
        },
        { name: 'Profile', type: 'page', description: 'User profile and settings' },
        {
          name: 'Notifications',
          type: 'page',
          description: 'User notifications',
          children: [
            { name: 'Likes', type: 'action', description: 'Likes on posts' },
            { name: 'Comments', type: 'action', description: 'Comments on posts' }
          ]
        },
        { name: 'Messages', type: 'page', linkType: 'related', description: 'Private messaging' },
        { name: 'Settings', type: 'page', description: 'Account and privacy settings' }
      ]
    },
    'news website': {
      name: 'News Website',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'Latest news and headlines' },
        {
          name: 'News Categories',
          type: 'decision',
          description: 'Filter news by category',
          children: [
            { name: 'Politics', type: 'page', description: 'Political news' },
            { name: 'Sports', type: 'page', description: 'Sports news' },
            { name: 'Entertainment', type: 'page', description: 'Entertainment news' }
          ]
        },
        {
          name: 'Article Page',
          type: 'page',
          description: 'Full news article',
          children: [
            { name: 'Comments', type: 'action', description: 'User comments on articles' },
            { name: 'Share', type: 'action', description: 'Social sharing options' }
          ]
        },
        { name: 'Search', type: 'action', description: 'Search news articles' },
        { name: 'About', type: 'page', linkType: 'related', description: 'About the news organization' },
        { name: 'Contact', type: 'page', description: 'Contact information' }
      ]
    },
    'learning management system': {
      name: 'Learning Management System',
      type: 'page',
      children: [
        { name: 'Login', type: 'action', description: 'User authentication' },
        { name: 'Dashboard', type: 'page', description: 'Overview of courses and progress' },
        {
          name: 'Courses',
          type: 'page',
          description: 'List of courses',
          children: [
            { name: 'Course Content', type: 'page', description: 'Lessons and materials' },
            { name: 'Assignments', type: 'action', description: 'Assignment submission and grading' }
          ]
        },
        {
          name: 'Grades',
          type: 'page',
          description: 'View grades and feedback',
          children: [
            { name: 'View Grades', type: 'action', description: 'Detailed grade reports' },
            { name: 'Feedback', type: 'page', description: 'Instructor feedback' }
          ]
        },
        { name: 'Discussion Forums', type: 'page', linkType: 'related', description: 'Course discussions and Q&A' },
        { name: 'Profile', type: 'page', description: 'User profile and settings' }
      ]
    },
    'fitness app': {
      name: 'Fitness App',
      type: 'page',
      children: [
        { name: 'Login', type: 'action', description: 'User authentication' },
        { name: 'Home Dashboard', type: 'page', description: 'Overview of fitness stats' },
        {
          name: 'Workouts',
          type: 'decision',
          description: 'Workout selection and tracking',
          children: [
            { name: 'Start Workout', type: 'action', description: 'Begin a workout session' },
            { name: 'View History', type: 'page', description: 'Past workout records' }
          ]
        },
        { name: 'Progress Tracking', type: 'page', description: 'Track fitness progress over time' },
        {
          name: 'Nutrition',
          type: 'page',
          description: 'Diet and meal planning',
          children: [
            { name: 'Meal Plans', type: 'action', description: 'Create and manage meal plans' },
            { name: 'Calorie Counter', type: 'page', description: 'Track daily calorie intake' }
          ]
        },
        { name: 'Community', type: 'page', linkType: 'related', description: 'Social features and groups' },
        { name: 'Settings', type: 'page', description: 'App settings and preferences' }
      ]
    },
    'travel booking': {
      name: 'Travel Booking Site',
      type: 'page',
      children: [
        { name: 'Home', type: 'page', description: 'Welcome and featured destinations' },
        {
          name: 'Search Flights/Hotels',
          type: 'action',
          description: 'Search for flights and hotels',
          children: [
            { name: 'Flight Results', type: 'page', description: 'List of available flights' },
            { name: 'Hotel Results', type: 'page', description: 'List of available hotels' }
          ]
        },
        { name: 'Booking Details', type: 'page', description: 'Review booking information' },
        {
          name: 'Payment',
          type: 'decision',
          description: 'Select payment method',
          children: [
            { name: 'Credit Card', type: 'action', description: 'Enter credit card details' },
            { name: 'PayPal', type: 'action', description: 'Pay via PayPal' }
          ]
        },
        { name: 'Confirmation', type: 'page', description: 'Booking confirmation and receipt' },
        { name: 'My Trips', type: 'page', linkType: 'related', description: 'Manage upcoming and past trips' },
        { name: 'Support', type: 'page', description: 'Customer support and FAQs' }
      ]
    }
  }), []);

  const genericTemplate = useMemo(() => ({
    name: 'Generic Site',
    type: 'page',
    children: [
      { name: 'Home', type: 'page' },
      { name: 'Services', type: 'page' },
      {
        name: 'Service Selection',
        type: 'decision',
        children: [
          { name: 'Basic Service', type: 'action' },
          { name: 'Premium Service', type: 'page' }
        ]
      },
      { name: 'Blog', type: 'page', linkType: 'related' },
      { name: 'Login', type: 'action' },
      { name: 'Contact', type: 'page' },
      {
        name: 'Checkout',
        type: 'decision',
        children: [
          { name: 'Payment Methods', type: 'page' },
          { name: 'Order Review', type: 'action' }
        ]
      },
      { name: 'Payment', type: 'page' }
    ]
  }), []);

  const colors = useMemo(() => ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'], []);

  const hierarchyToGraph = useCallback((data) => {
    const nodes = [];
    const links = [];

    // Use tree layout for initial positions to avoid random overlaps
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    const traverse = (d, parentId = null, depth = 0) => {
      const id = nodes.length;
      const hasChildren = d.children && d.children.length > 0;
      nodes.push({
        id,
        name: d.data.name,
        type: d.data.type || 'action',
        x: d.y + width / 2, // Horizontal tree
        y: d.x + height / 2,
        depth,
        fx: d.y + width / 2,
        fy: d.x + height / 2,
        hasChildren,
      });

      if (parentId !== null) {
        links.push({
          source: nodes[parentId],
          target: nodes[id],
          label: d.data.label || '',
          type: d.data.linkType || 'direct'
        });
      }

      if (d.children) {
        d.children.forEach(child => traverse(child, id, depth + 1));
      }
    };

    traverse(root);
    return { nodes, links };
  }, [width, height]);

  // Define recursive functions using useCallback to avoid parsing issues
  const addChildToNode = useCallback((root, parentName, newChild) => {
    if (root.name === parentName) {
      root.children = root.children || [];
      root.children.push(newChild);
      return root;
    }
    if (root.children) {
      for (let i = 0; i < root.children.length; i++) {
        const updated = addChildToNode(root.children[i], parentName, newChild);
        if (updated) {
          root.children[i] = updated;
          return root;
        }
      }
    }
    return null;
  }, []);

  const removeNodeByName = useCallback((root, targetName) => {
    if (root.name === targetName) {
      return null; // Remove this node
    }
    if (root.children) {
      root.children = root.children.map(child => removeNodeByName(child, targetName)).filter(Boolean);
      return root;
    }
    return root;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth - 40);
      setHeight(window.innerHeight - 200);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Removed JSON upload feature, replaced with Referent feature placeholder
  // const handleFileUpload = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;

  //   if (!file.name.endsWith('.json')) {
  //     setError('Please select a JSON file.');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');

  //   try {
  //     const text = await file.text();
  //     const jsonData = JSON.parse(text);
  //     setIaData(jsonData);
  //     setError('');
  //   } catch (err) {
  //     setError('Invalid JSON file.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    if (iaData) {
      setGraphData(hierarchyToGraph(iaData));
    }
  }, [iaData, hierarchyToGraph]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3003/ia');
      if (response.ok) {
        const data = await response.json();
        setIaData(data);
        setError('');
      } else {
        setIaData(null);
        setError('');
      }
    } catch (err) {
      setError('Failed to fetch data.');
    }
  };

  const zoomIn = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.scaleBy(d3.select(svgRef.current), 1.2);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.scaleBy(d3.select(svgRef.current), 0.8);
    }
  }, []);

  const fitToScreen = useCallback(() => {
    if (gRef.current && svgRef.current) {
      const bounds = gRef.current.getBBox();
      const fullWidth = width;
      const fullHeight = height;
      const midX = (bounds.x + bounds.width / 2);
      const midY = (bounds.y + bounds.height / 2);
      const scale = 0.85;
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
      zoomRef.current.transform(d3.select(svgRef.current), d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
  }, [width, height]);

  const resetView = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.transform(d3.select(svgRef.current), d3.zoomIdentity);
    }
  }, []);

  const addNode = useCallback(() => {
    if (!selectedNodeName || !iaData) return;

    const newChild = {
      name: `New Node ${Date.now()}`,
      type: 'action',
      children: []
    };

    const newIaData = JSON.parse(JSON.stringify(iaData)); // Deep copy
    addChildToNode(newIaData, selectedNodeName, newChild);
    setIaData(newIaData);
    setSelectedNodeName(null);
  }, [iaData, selectedNodeName, addChildToNode]);

  const deleteNode = useCallback(() => {
    if (!selectedNodeName || !iaData) return;

    const newIaData = JSON.parse(JSON.stringify(iaData)); // Deep copy
    const updatedRoot = removeNodeByName(newIaData, selectedNodeName);
    if (updatedRoot) {
      setIaData(updatedRoot);
    } else {
      setIaData(null);
    }
    setSelectedNodeName(null);
  }, [iaData, selectedNodeName, removeNodeByName]);

  const startEditing = useCallback((d) => {
    setEditingNodeId(d.id);
    setEditingText(d.name);
  }, []);

  const saveEditing = useCallback(() => {
    if (editingNodeId !== null) {
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === editingNodeId ? { ...n, name: editingText } : n)
      }));
      setEditingNodeId(null);
      setEditingText('');
    }
  }, [editingNodeId, editingText]);

  const cancelEditing = useCallback(() => {
    setEditingNodeId(null);
    setEditingText('');
  }, []);

  const getNodePath = useCallback((d) => {
    const w = 80; // half width 160
    const h = 30; // half height 60
    const rx = 8;
    const ry = 8;

    switch (d.type) {
      case 'action':
        // Oval (ellipse)
        return `M ${-w} 0 A ${w} ${h} 0 1 1 ${w} 0 A ${w} ${h} 0 1 1 ${-w} 0 Z`;
      case 'decision':
        // Diamond
        return `M 0 ${-h} L ${w} 0 L 0 ${h} L ${-w} 0 Z`;
      case 'page':
      default:
        // Rounded rectangle
        return `M ${-w + rx} ${-h} h ${w - 2 * rx} a ${rx} ${ry} 0 0 1 ${rx} ${ry} v ${h - 2 * ry} a ${rx} ${ry} 0 0 1 -${rx} ${ry} h ${-(w - 2 * rx)} a ${rx} ${ry} 0 0 1 -${rx} -${ry} v ${-(h - 2 * ry)} a ${rx} ${ry} 0 0 1 ${rx} -${ry} z`;
    }
  }, []);

  const generateIA = useCallback((keywordParam) => {
    const keyword = (keywordParam || '').trim().toLowerCase();
    if (!keyword) {
      setError('Please enter a keyword');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let generated;
      if (templates[keyword]) {
        generated = templates[keyword];
      } else {
        generated = genericTemplate;
        setError('Keyword not recognized. Using generic template. Try "e-commerce", "portfolio", or "blog".');
      }
      setIaData(generated);
      // Auto-fit after generation
      setTimeout(() => fitToScreen(), 100);
    } catch (err) {
      setError('Failed to generate IA.');
      setIaData(genericTemplate);
      setTimeout(() => fitToScreen(), 100);
    } finally {
      setLoading(false);
    }
  }, [templates, genericTemplate, fitToScreen]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!graphData.nodes.length || error) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    gRef.current = g.node();

    // Add zoom and pan with smooth transitions
    zoomRef.current = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        if (gRef.current) d3.select(gRef.current).attr('transform', event.transform);
      });

    svg.call(zoomRef.current);

    // Enhanced defs for arrow markers, shadow, and glow
    const defs = svg.append('defs');

    // Arrowhead
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#4b5563') // darker gray for better contrast
      .attr('stroke', 'none');

    // Soft shadow
    const shadowFilter = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    shadowFilter.append('feDropShadow')
      .attr('dx', 1)
      .attr('dy', 1)
      .attr('stdDeviation', 3)
      .attr('flood-color', 'rgba(0,0,0,0.15)');

    // Glow for hover
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3)
      .attr('result', 'blur');

    glowFilter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('result', 'offsetBlur');

    glowFilter.append('feFlood')
      .attr('flood-color', '#2563eb') // blue glow for hover
      .attr('flood-opacity', '0.9')
      .attr('result', 'glowColor');

    glowFilter.append('feComposite')
      .attr('in', 'glowColor')
      .attr('in2', 'offsetBlur')
      .attr('operator', 'in')
      .attr('result', 'glowShape');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'glowShape');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Curved links for smoother appearance
    const link = g.selectAll('.link')
      .data(graphData.links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke', '#6b7280') // darker gray for better visibility
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', d => d.type === 'related' ? '6,6' : 'none')
      .attr('d', linkArc)
      .style('transition', 'stroke 0.3s ease, stroke-width 0.3s ease');

    // Link labels (hidden if empty)
    const linkLabel = g.selectAll('.link-label')
      .data(graphData.links)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('font-size', 14)
      .attr('fill', '#374151') // dark gray for better readability
      .attr('font-weight', '600')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => Math.min(d.source.y, d.target.y) - 20)
      .style('pointer-events', 'none')
      .text(d => d.label || '')
      .style('display', d => d.label ? 'block' : 'none')
      .style('text-shadow', 'none');

    // Nodes with animations, hover glow
    const node = g.selectAll('.node')
      .data(graphData.nodes)
      .enter().append('g')
      .classed('node', true)
      .attr('opacity', 0)
      .style('transition', 'opacity 0.5s ease')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        if (editingNodeId !== null) {
          saveEditing();
        }
        setSelectedNodeName(d.name);
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation();
        startEditing(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).select('path')
          .attr('filter', 'url(#glow)')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 4);
        // Highlight outgoing links
        g.selectAll('.link').filter(l => l.source.id === d.id)
          .attr('stroke', '#3b82f6').attr('stroke-width', 3.5);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('path')
          .attr('filter', 'url(#shadow)')
          .attr('stroke', selectedNodeName === d.name ? '#3b82f6' : colors[d.depth % colors.length])
          .attr('stroke-width', selectedNodeName === d.name ? 4 : 2.5);
        g.selectAll('.link').attr('stroke', '#9ca3af').attr('stroke-width', 2.5);
      });

    // Set node positions directly from tree layout
    node
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x}, ${d.y}) scale(0.7)`)
      .transition()
      .duration(500)
      .attr('opacity', 1)
      .attr('transform', d => `translate(${d.x}, ${d.y}) scale(1)`);

    node.append('rect')
      .attr('x', d => {
        if (d.type === 'decision') return -70;
        if (d.type === 'action') return -80;
        return -90;
      })
      .attr('y', d => -25)
      .attr('width', d => {
        if (d.type === 'decision') return 140;
        if (d.type === 'action') return 160;
        return 180;
      })
      .attr('height', 50)
      .attr('rx', d => (d.type === 'decision' ? 0 : 15))
      .attr('ry', d => (d.type === 'decision' ? 0 : 15))
      .attr('fill', d => {
        switch (d.type) {
          case 'page': return '#e0e7ff'; // lighter blue
          case 'action': return '#d1fae5'; // lighter green
          case 'decision': return '#fed7aa'; // orange
          default: return '#f3f4f6'; // light gray
        }
      })
      .attr('stroke', d => selectedNodeName === d.name ? '#2563eb' : colors[d.depth % colors.length])
      .attr('stroke-width', d => selectedNodeName === d.name ? 4 : 2)
      .attr('filter', 'url(#shadow)');

    node.each(function(d) {
      const group = d3.select(this);
      if (d.id === editingNodeId) {
        const foreignObject = group.append('foreignObject')
          .attr('x', -80)
          .attr('y', -25)
          .attr('width', 160)
          .attr('height', 50);

        foreignObject.append('xhtml:input')
          .attr('type', 'text')
          .property('value', editingText)
          .style('width', '100%')
          .style('height', '100%')
          .style('border', 'none')
          .style('outline', 'none')
          .style('font-size', '16px')
          .style('font-family', 'Inter, system-ui, sans-serif')
          .style('font-weight', '600')
          .style('text-align', 'center')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .on('input', function(event) {
            setEditingText(event.target.value);
          })
          .on('keydown', function(event) {
            if (event.key === 'Enter') {
              saveEditing();
            } else if (event.key === 'Escape') {
              cancelEditing();
            }
          })
          .on('blur', saveEditing);
      } else {
        group.append('text')
          .attr('text-anchor', 'middle')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.35em')
          .attr('font-size', '16px')
          .attr('font-family', 'Inter, system-ui, sans-serif')
          .attr('font-weight', '600')
          .attr('fill', '#1e293b')
          .text(d => d.name)
          .style('pointer-events', 'none')
          .call(wrapText, 160);
      }
    });

  // Helper function to wrap text inside nodes
  function wrapText(text, width) {
    text.each(function() {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1; // ems
      const y = text.attr('y');
      const dy = 0;
      let tspan = text.text(null).append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');
      while (words.length) {
        word = words.pop();
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
        }
      }
    });
  }

    function linkArc(d) {
      const source = d.source;
      const target = d.target;
      // Curved bezier line for smoother appearance
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const cp1x = source.x + dx / 3;
      const cp1y = source.y + dy / 2 - 20;
      const cp2x = source.x + 2 * dx / 3;
      const cp2y = target.y - dy / 2 + 20;
      return `M ${source.x} ${source.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${target.x} ${target.y}`;
    }

    function dragstarted(event, d) {
      // No simulation, just start drag
    }

    function dragged(event, d) {
      // Constrain both x and y
      d.x = snapToGrid ? Math.round(event.x / 20) * 20 : event.x;
      d.y = snapToGrid ? Math.round(event.y / 20) * 20 : event.y;
      d3.select(this).attr('transform', `translate(${d.x}, ${d.y})`);
      // Update links
      link.attr('d', linkArc);
      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => Math.min(d.source.y, d.target.y) - 15);
    }

    function dragended(event, d) {
      // No simulation to stop
    }
  }, [graphData, error, width, height, colors, snapToGrid, selectedNodeName, startEditing, saveEditing, cancelEditing, editingNodeId, editingText, getNodePath]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        return; // Don't interfere with input fields
      }

      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          fitToScreen();
          break;
        case 'r':
        case 'R':
        case '0':
          event.preventDefault();
          resetView();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitToScreen, resetView]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-4 bg-white shadow-sm border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            ← Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">IA Flowchart Diagram</h1>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2">
            {/* Replace text input with dropdown for keyword selection */}
            <select
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); if (e.target.value) generateIA(e.target.value); }}
              disabled={loading}
              className="w-64 px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm placeholder-gray-500"
            >
              <option value="">Select a keyword</option>
              {Object.keys(templates).map((key) => (
                <option key={key} value={key}>
                  {templates[key].name} ({key})
                </option>
              ))}
            </select>
            {/* Referent feature */}
            <button
              onClick={() => navigate('/referent')}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Referent
            </button>
            <button
              onClick={() => navigate('/ai-chat')}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              AI Chat
            </button>
          </div>
        </div>
      </div>
      {loading && <p className="p-2 text-blue-500 text-center">Uploading...</p>}
      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded border border-red-400 text-center" role="alert">{error}</div>}
      <div className="flex-1 relative">
        <svg ref={svgRef} width={width} height={height} className="absolute inset-0 w-full h-full bg-white">
        </svg>
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg p-2 border flex flex-col space-y-1 z-10">
          <button onClick={zoomIn} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">+</button>
          <button onClick={zoomOut} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">-</button>
          <button onClick={fitToScreen} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">↔</button>
          <button onClick={resetView} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 shadow-sm">⟲</button>
          <button onClick={addNode} className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700 shadow-sm">+</button>
          <button onClick={deleteNode} disabled={selectedNodeName === null} className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 disabled:opacity-50 shadow-sm">×</button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`px-2 py-1 text-xs rounded text-gray-700 shadow-sm ${snapToGrid ? 'bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}>⊞</button>
        </div>
        {/* Legend */}
        <div
          className="absolute bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200 z-50 max-w-xs backdrop-blur-sm cursor-move select-none"
          style={{ left: legendPosition.x, top: legendPosition.y }}
          onMouseDown={(e) => {
            setIsDraggingLegend(true);
            setDragOffset({
              x: e.clientX - legendPosition.x,
              y: e.clientY - legendPosition.y,
            });
          }}
          onMouseUp={() => setIsDraggingLegend(false)}
          onMouseLeave={() => setIsDraggingLegend(false)}
          onMouseMove={(e) => {
            if (isDraggingLegend) {
              setLegendPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
              });
            }
          }}
        >
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Legend</h3>
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-lg">□</span>
              <span className="text-blue-600">Rectangle = Page / Screen</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">○</span>
              <span className="text-green-600">Oval = Process / Action</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">◇</span>
              <span className="text-orange-600">Diamond = Decision</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">———</span>
              <span>Solid line = Direct navigation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">- - -</span>
              <span>Dashed line = Related link</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default IAFlowchart;
