import FIRButton from './FIRButton';

const YourComponent = () => {
  const handleClick = () => {
    // Handle click action
    console.log('Button clicked!');
  };

  return (
    <FIRButton onClick={handleClick}>
      File FIR
    </FIRButton>
  );
};