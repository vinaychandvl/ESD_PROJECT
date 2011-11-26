<!DOCTYPE HTML>
<html>
<head>
    <title>Save Files</title>
</head>
<body>
<?php
if (isset($_POST["data"])){
  $data = stripslashes($_POST["data"]);
  $file = fopen("../files/" . $_POST["name"] . ".json", "w") or die("error");
  fwrite($file, $data);
  fclose($file);
  echo "saved";
}
?>
</body>
</html>