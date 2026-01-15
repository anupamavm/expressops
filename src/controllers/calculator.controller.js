const calculate = (req, res) => {
  const { num1, num2, operation } = req.body;

  if (num1 === undefined || num2 === undefined || !operation) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide num1, num2, and operation',
    });
  }

  const n1 = parseFloat(num1);
  const n2 = parseFloat(num2);

  if (isNaN(n1) || isNaN(n2)) {
    return res.status(400).json({
      status: 'error',
      message: 'num1 and num2 must be valid numbers',
    });
  }

  let result;

  switch (operation) {
    case 'add':
      result = n1 + n2;
      break;
    case 'subtract':
      result = n1 - n2;
      break;
    case 'multiply':
      result = n1 * n2;
      break;
    case 'divide':
      if (n2 === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot divide by zero',
        });
      }
      result = n1 / n2;
      break;
    default:
      return res.status(400).json({
        status: 'error',
        message: 'Invalid operation. Use: add, subtract, multiply, or divide',
      });
  }

  res.status(200).json({
    status: 'success',
    operation,
    num1: n1,
    num2: n2,
    result,
  });
};

module.exports = { calculate };
