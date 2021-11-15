// // sweet alert for delete user button
// function deleteProduct(id){ 
//     swal({ 
//       title: "Are you sure?",
//       text:"Once deleted, you will not be able to recover this user!",
//       icon:"warning",
//       buttons: true,
//       dangerMode: true,
//       })
//       .then((willDelete) => {
//         if(willDelete) { 
//           $.ajax({ 
//             url:"/delete-user",
//             method:"POST",
//             data:{id:id},
//             success:(result)=>{ 
//               if(result.status){
//                 swal("User deleted Successfully", {
//                   icon: "success", 
//                 });
//               } 
//               location.href='/admin' 
//             }
//           });
//         }
//       })
//     }