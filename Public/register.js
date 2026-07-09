// write j query to send form data to api/signin
$(document).ready(function(){
    $("#signup-form").submit(function(event){
        event.preventDefault();

        const username= $("#username").val();
        const email = $("#email").val().trim();
        const password=$("#password").val();
        const repeatPassword=$("#repeat-password").val();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (password!==repeatPassword){
            alert("Passwords don't match")
            return;
        }



        $.ajax({
            url:"/api/register",
            method:"POST",
            contentType:"application/json",
            data:JSON.stringify({username:username,email:email,password:password}),
            success:function(data){
                $("#username").val("");
                $("#email").val("");
                $("#password").val("");
                $("#repeat-password").val("");
                if(data.success===true){
                    document.cookie = "token="+data.token;
                    window.location.href="/index.html";
                    
                }
                else{
                    alert("Username already exists")
                }
            
            },
            error:function(error){
                const message = error.responseJSON && error.responseJSON.message ? error.responseJSON.message : "Something went wrong";
                alert(message);
            }
        });
        
    })



})