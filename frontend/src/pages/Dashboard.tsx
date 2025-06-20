import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Панель управления
        </Typography>
        <Typography variant="body1">
          Добро пожаловать в систему управления задачами!
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard; 