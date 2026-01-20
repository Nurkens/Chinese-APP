import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import React, { useEffect, useState } from 'react';

const Home: React.FC = () => {

  const [message, setMessage] = useState('Загрузка...');

  useEffect(() => {
    
    fetch('http://192.0.2.2:3000')
      .then(res => res.text()) 
      .then(data => {
        setMessage(data); 
      })
      .catch(err => {
        console.error(err);
        setMessage('Ошибка: Бэкенд не отвечает');
      });
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Изучение Китайского</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Статус системы:</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {}
            <h2>{message}</h2>
          </IonCardContent>
        </IonCard>

        <p>Если Hello World , то тогда работает хехе</p>
        
      </IonContent>
    </IonPage>
  );
};

export default Home;