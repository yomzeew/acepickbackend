interface Message {
    title: string,
    body: string
}

export const registerEmail = (user: any): Message => {
    return {
        title: "Welcome to Acepick",
        body: `Welcome on board ${user.profile?.firstName} ${user.profile?.lastName},
        <br><br> 
        we are pleased to have you on Acepick, 
        please validate your account by providing your BVN 
        to get accessible to all features on Acepick.<br><br> Thanks.`
    }
}

export const sendOTPPhone = (code: string): Message => {
    return {
        title: "Acepick OTP",
        body: `Your OTP code is ${code}.`
    }
}

export const sendOTPEmail = (code: string): Message => {
    return {
        title: "Email Verification",
        body: `Dear User,<br><br>
          
            Thank you for choosing our service. To complete your registration
             and ensure the security of your account,
              please use the verification code below
              <br><br>
            
             Verification Code: ${code}
            <br><br>
            
            Please enter this code on our website/app to
             proceed with your registration process. 
             If you did not initiate this action, 
             please ignore this email.<br><br>`
    }
}

export const forgotPasswordEmail = (code: string): Message => {
    return {
        title: "Reset Password",
        body: `Dear User,<br><br>

            We have received a request to reset your password. 
            If you did not make this request, please ignore this email.
             Otherwise, please use the verification code below to reset your password.
             <br><br>

             Verification Code: ${code}
            <br><br>

            Please enter this code on our website/app to
             proceed with the password reset process. 
             If you did not initiate this action, 
             please ignore this email.<br><br>`
    }
}


export const jobCreatedEmail = (job: any): Message => {
    return {
        title: `Job created: ${job.title}`,
        body: `You have a new job from ${job.client.profile.firstName} ${job.client.profile.lastName}
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>

        Log into your account to accept or decline the job offer.
        `
    }
}

export const jobUpdatedEmail = (job: any): Message => {
    return {
        title: `Job Updated`,
        body: `The job ${job.title} has updated by ${job.client.profile.firstName} ${job.client.profile.lastName}
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>

        Log into your account to accept or decline the job offer.
        `
    }
}

export const jobResponseEmail = (job: any): Message => {
    const response = job.accepted ? "accepted" : "declined"


    return {
        title: `Job ${response}: ${job.title}`,
        body: `Your job offer has been ${response} by ${job.professional.profile.firstName} ${job.professional.profile.lastName}
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>
        `
    }
}

// export const jobPayment = (job: Job): Message => {
//     return {
//         title: `Job Payment`,
//         body: `Your has been paid by ${job.client.profile.firstName} ${job.client.profile.lastName}
//         <p><b>Job title: </b>${job.title}</p>
//         <p><b>Job description: </b>${job.description}</p>
//         <p><b>Job location: </b>${job.fullAddress}</p>
//         <br>
//         <br>
//         <p>Kindly proceed with the job</p>
//         `
//     }
// }


export const jobDisputeEmail = (job: any, dispute: any): Message => {

    return {
        title: `Job dispute: ${job.title}`,
        body: `A dispute has been raised for job ${job.title} by ${job.professional.profile.firstName} ${job.professional.profile.lastName}
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>
        <p><b>Dispute reason: </b>${dispute.reason}</p>
        <p><b>Dispute description: </b>${dispute.description}</p>
        `
    }
}

export const invoiceGeneratedEmail = (job: any): Message => {

    return {
        title: `Invoice generated: ${job.title}`,
        body: `An invoice has been generated for job ${job.title} by ${job.professional.profile.firstName} ${job.professional.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>

        <p><b>Workmanship: </b>${job.workmanship}</p>
        <p><b>Cost of materials: </b>${job.materialsCost ?? 'N/A'}</p>
        <p><b>Date: </b>${job.updatedAt}</p>
        <br>
        <p>Log into the platform to view full details</p>
        `}
}

export const invoiceUpdatedEmail = (job: any): Message => {

    return {
        title: `Invoice updated: ${job.title}`,
        body: `An invoice has been updated for job ${job.title} by ${job.professional.profile.firstName} ${job.professional.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
                <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>

        <p><b>Workmanship: </b>${job.workmanship}</p>
        <p><b>Cost of materials: </b>${job.materialsCost ?? 'N/A'}
        </p>
                    <p><b>Date: </b>${job.updatedAt}</p>
        <br>
        <p>Log into the platform to view full details</p>
        `
    }
}

export const completeJobEmail = (job: any) => {
    return {
        title: `Job Completed`,
        body: `Your job ${job.title} has been completed by ${job.client.profile.firstName} ${job.client.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
                <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>

            `
    }
}

export const approveJobEmail = (job: any) => {
    return {
        title: `Job Approved`,
        body: `Your job ${job.title} has been approved by ${job.professional.profile.firstName} ${job.professional.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>
            `
    }
}


export const disputedJobEmail = (job: any, dispute: any) => {
    return {
        title: `Job Disputed`,
        body: `Your job ${job.title} has been disputed by ${job.client.profile.firstName} ${job.client.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}</p>

        <h3>Dispute</h3>
        <p><b>Dispute title: </b>${dispute.reason}</p>
        <p><b>Dispute description: </b>${dispute.description}</p>
            `
    }
}

export const jobPaymentEmail = (job: any) => {
    return {
        title: `Job Payment`,
        body: `Your job ${job.title} has been paid by ${job.client.profile.firstName} ${job.client.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}
        `
    }
}

export const productPaymentEmail = (productTrans: any) => {
    return {
        title: `Product Payment`,
        body: `Your Product - ${productTrans.product.name} has been paid by ${productTrans.buyer.profile.firstName} ${productTrans.buyer.profile.lastName}
        <br>
        <h3>Summary</h3>
        <p><b>Product name: </b>${productTrans.product.name}</p>
        <p><b>Product description: </b>${productTrans.product.description}</p>
        <p><b>Price: </b>${productTrans.price}
        <p><b>Quantity: </b>${productTrans.quantity}</p>
        <p><b>Date: </b>${productTrans.date}
        `
    }
}

export const jobCancelledEmail = (job: any) => {
    return {
        title: `Job Cancelled`,
        body: `Your job ${job.title} has been cancelled by ${job.client.profile.firstName} ${job.client.profile.lastName}
        <h3>Summary</h3>
        <p><b>Job title: </b>${job.title}</p>
        <p><b>Job description: </b>${job.description}</p>
        <p><b>Job location: </b>${job.fullAddress}
        `
    }
}


export const suspendUserEmail = (user: any) => {
    return {
        title: `Account Suspended`,
        body: `Your account has been temporarily suspended by the admin due to violation of the terms and conditions
        of the platform. Please contact the admin for more information.
        `
    }
}

export const reactivateUserEmail = (user: any) => {
    return {
        title: `Account Activated`,
        body: `Your account has been re-activated by the admin. You can now log in and start using the platform.
        `
    }
}

export const approveProductEmail = (product: any) => {
    return {
        title: `Product Approved`,
        body: `Your product <b>${product.name}</b> has been approved by the admin. It is now available for purchase.
        <h3>Summary</h3>
        <p><b>Product title: </b>${product.name}</p>
        <p><b>Product description: </b>${product.description}</p>
        <p><b>Product price: </b>${product.price}<b><p>
        `
    }
}

export const rejectProductEmail = (product: any) => {
    return {
        title: `Product Rejected`,
        body: `Your product <b>${product.name}</b> has been rejected by the admin. Please review your product and resubmit for approval.
        <h3>Summary</h3>
        <p><b>Product title: </b>${product.name}</p>
        <p><b>Product description: </b>${product.description}</p>
             `}
}

export const deactivatedUserEmail = (user: any) => {
    return {
        title: `Account Deactivated`,
        body: `Your account has been deactivated by the admin. Please contact the admin for more information.`
    }
}

export const suspendedUserEmail = (user: any) => {
    return {
        title: `Account Suspended`,
        body: `Your account has been suspended by the admin. Please contact the admin for more information.`
    }
}

export const reactivatedUserEmail = (user: any) => {
    return {
        title: `Account Reactivated`,
        body: `Your account has been reactivated by the admin. You can now log in and start using the platform.`
    }
}

export const disputedOrderEmail = (productTrans: any, dispute: any) => {
    return {
        title: `Dispute Created`,
        body: `A dispute has been created for your order with the product <b>${productTrans.product.name}</b>. Please review the dispute and take appropriate action.<br><br>
        
        <h3>Product</h3>
        <p><b>Product name: </b>${productTrans.product.name}</p>
        <p><b>Product description: </b>${productTrans.product.description}</p>
        <p><b>Price: </b>${productTrans.price}</p>


        <h3>Dispute</h3>
        <p><b>Dispute title: </b>${dispute.reason}</p>
        <p><b>Dispute description: </b>${dispute.description}</p>
        `
    }
}

export const resolveDisputeEmail = (dispute: any) => {
    return {
        title: "Dispute resolved",
        body: `
            Your dispute has been successfully resolved. All withheld funds will be released to you shortly.
            <h3>Dispute</h3>
            <p><b>Dispute title:</b> ${dispute.reason}</p>
            <p><b>Dispute description:</b> ${dispute.description}</p>
        `
    };
};

