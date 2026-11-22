<?php 
    session_start();
    
    $conn = mysqli_connect('localhost', 'root', '', 'cache_carry_co');

    if(!$conn) {
        die("Connection database failed: " . mysqli_connect_error());
    }
?>

