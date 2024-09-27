<?php
if(isset($_POST['monday'])){
    echo"Monday";
}
if(isset($_POST['tuesday'])){
    echo"Tuesday";
}
if(isset($_POST['wednesday'])){
    echo"Wednesday";
}
if(isset($_POST['thursday'])){
    echo"Thursday";
}
if(isset($_POST['friday'])){
    echo"Friday";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Days of the Week</title>
</head>
<body>
    <form action="" method="post">
    <button name='monday'>Monday</button>
    <button name='tuesday'>Tuesday</button>
    <button name='wednesday'>Wednesday</button>
    <button name='thursday'>Thursday</button>
    <button name='friday'>Friday</button>
    </form>
</body>
</html>