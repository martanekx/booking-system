<?php
session_start();
error_reporting(E_ALL);
include("PFBC/Form.php");

if(isset($_POST["form"])) {
	Form::isValid($_POST["form"]);
	header("Location: " . $_SERVER["PHP_SELF"]);
	exit();	
}

include("header.php");
?>
	<body id="single">
		<div class="xls">
			<?php 
				echo file_get_contents("input.xls");
			?></div>
		<div>
			<div id="left"></div>
			<div id="middle">
				<div id="head"></div>
				<div id="cinema"></div>
				<div id="foot"></div>
			</div>
			<div id="right"></div>
			<div style="clear: both"></div>
		</div>
		<div id="reserved"><ul>
			<?php 
				$id_spojeni = mysql_connect('localhost','root','a10b0618p');
				$vysledek_vybrani = mysql_select_db('cinema',$id_spojeni);
				$query = "SELECT * FROM seats";
				$vysledek = mysql_query($query,$id_spojeni);
				while ($row= mysql_fetch_assoc($vysledek))
				//foreach($vysledek as $row)
				{
					echo "<li>" . $row['seat'] . "_" . $row['serie'] . "</li>";
				}
				
				mysql_close($id_spojeni);
			?>
		</ul></div>
		<div id="selected">
			<form action="save.php" method="post">
				<input type='submit' name='Zarezervovat' />
			</form>
		</div>
		<!--script type="text/JavaScript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script-->
		<script type="text/JavaScript" src="jquery.js"></script>
		<script type="text/JavaScript" src="jquery.cinemaPlugin.js"></script>	
		<script type="text/JavaScript" src="test.js"></script>
	</body>
</html>