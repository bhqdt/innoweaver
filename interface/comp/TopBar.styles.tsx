import styled from 'styled-components';
import { Container, Row, Col, Button } from 'react-bootstrap';

export const Notification = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 5px;
  color: #fff;
  background-color: #4CAF50;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
`;

export const NotificationClose = styled.button`
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  float: right;
`;

// export const TopBarWrapper = styled.div`
export const TopBarWrapper = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 12.5rem;
    height: 100vh;
    background-color: #171717;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    color: #FFFFFF;
    box-shadow: 0 1px 10px rgba(255, 255, 255, 0.5);
`;

export const UserBarWrapper = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 3rem;
    // background-color: #171717;
    // background-color: #FFFFFF;
    z-index: 1000;
    display: flex;
    justify-content: flex-center;
    align-items: flex-end;
    color: #FFFFFF;
`;

export const Title = styled.h1`
    font-size: 1.5rem;
    font-weight: bold;
    margin-left: 1rem;
    margin-top: 2.5rem;
`;

export const GalleryContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-grow: 1;
    width: 100%;
    margin-top: 1rem;
`;

export const FlexContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-grow: 1;
    width: 100%;
    // margin-top: 25rem;
    margin-top: 45vh;
    // background-color: white;
`;

export const Router = styled.button`
    width: 90%;    
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    margin-left: 1rem;
    font-family: "Myriad pro Semibold";
    font-size: 1rem;
    font-weight: 600;
    padding: 8px;
    border-radius: 1rem;
    // background-color: #888888;
`;

export const UserTypeText = styled.button`
    // margin-bottom: 20px;
    margin-left: 0.5rem;
    color: #ADD8E6;
    // background-color: #ADD800;
`;

export const Avater = styled.button`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: #ADD8E6;
    border: none;
    color: #FFFFFF;
    cursor: pointer;
    margin-right: 3rem;
    font-weight: bold;
    color: #333333;
`;

export const FormWrapper = styled.div`
    position: absolute;
    top: 50px;
    right: 50px;
    width: 320px;
    padding: 20px;
    background-color: #1F1F1F;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    font-size: 14px;
    z-index: 999;
`;

export const FormContainer = styled.div`
    width: 100%;
    // background-color: red;
`;


export const UserInfoContainer = styled.div`
    width: 100%;
    padding: 8px;
    word-wrap: break-word;
    max-width: 100%;
    overflow: hidden;
`;

export const APIContainer = styled.div`
    width: 100%;
    padding: 8px;
    word-wrap: break-word;
    max-width: 100%;
    overflow: hidden;
    // background-color: green;
`;

export const APIInput = styled.input`
    background-color: #333333;
    border-color: #FFFFFF;
    border-width: 1px;
    color: #CCCCCC;
    padding: 5px;
    margin-right: 10px;
    margin-top: 5px;
    border-radius: 5px;
    min-width: 75%;
`;

export const APISaveButton = styled.button`
    background-color: #888888;
    padding: 5px 8px;
    border-radius: 5px;
`;

export const ButtonsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px;
    margin-top: 10px;
    margin-right: 12px;
    // background-color: white;
`;

export const SubmitButton = styled.button`
    padding: 5px 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    color: #FFFFFF;
    width: 48%;
`;
