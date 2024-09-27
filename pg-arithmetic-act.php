<?php
  if(isset($_POST['submit'])){
    $number1 = $_POST['num1']; // Fixed missing underscore
    $number2 = $_POST['num2'];
  }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arithmetic Operation</title>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
</head>
<body>
   <div class="container mt-5">
      <h2>Arithmetic Operation</h2>
      <form action="" method="post" class="mt-3">
        <div class="mb-3">
            <label for="num1" class="form-label">First Number</label>
            <input type="number" name="num1" class="form-control" placeholder="Enter first number" required>
        </div>
        <div class="mb-3">
            <label for="num2" class="form-label">Second Number</label>
            <input type="number" name="num2" class="form-control" placeholder="Enter second number" required>
        </div>
        <button type="submit" name="submit" class="btn btn-primary">Submit</button>
        <button type="reset" name="reset" class="btn btn-secondary">Reset</button>
      </form>
      <br>

      <!--Display results here -->
      <?php
        if(isset($_POST['submit'])){
            echo "<div class='alert alert-success'>";
            echo "The sum of two numbers: " . ($number1 + $number2) . "<br>";
            echo "The difference of two numbers: " . ($number1 - $number2) . "<br>";    
            echo "The product of two numbers: " . ($number1 * $number2) . "<br>";    
            echo "The quotient of two numbers: " . ($number1 / $number2) . "<br>";
            echo "</div>";
        }
      ?>
   </div>
</body>
</html>
