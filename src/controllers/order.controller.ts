import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { OrderService } from "../services/order.service";
import { OrderStatus } from "../models/Order";

const orderService = new OrderService();

export class OrderController {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { customerName, customerPhone, bookings } = req.body;

      const order = await orderService.createOrder({
        orgId,
        customerName,
        customerPhone,
        bookings: bookings?.map((b: any) => ({
          ...b,
          fromDateTime: new Date(b.fromDateTime),
          toDateTime: new Date(b.toDateTime),
        })),
      });

      res.status(201).json(order);
    } catch (error: any) {
      if (error.message === "Product not found for this org") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "CONFLICT") {
        return res.status(409).json({
          message: "Conflicting bookings found",
          conflicts: [],
        });
      }
      console.error("Create order error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async listOrders(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { status, startDate, endDate, search } = req.query;

      const orders = await orderService.listOrders({
        orgId,
        status: status as OrderStatus | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        search: search as string | undefined,
      });

      res.json(orders);
    } catch (error) {
      console.error("List orders error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getOrder(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const order = await orderService.getOrderById(id, orgId);
      res.json(order);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      console.error("Get order error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateOrder(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const { customerName, customerPhone } = req.body;

      const order = await orderService.updateOrder(id, orgId, {
        customerName,
        customerPhone,
      });

      res.json(order);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      console.error("Update order error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async addBooking(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const {
        productId,
        categoryId,
        fromDateTime,
        toDateTime,
        decidedRent,
        advanceAmount,
        additionalItemsDescription,
        overrideConflicts,
      } = req.body;

      const booking = await orderService.addBookingToOrder(id, orgId, {
        productId,
        categoryId,
        fromDateTime: new Date(fromDateTime),
        toDateTime: new Date(toDateTime),
        decidedRent,
        advanceAmount,
        additionalItemsDescription,
        overrideConflicts,
      });

      res.status(201).json(booking);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Product not found for this org") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "Cannot add booking to cancelled order") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "CONFLICT") {
        return res.status(409).json({
          message: "Conflicting bookings found",
          conflicts: [],
        });
      }
      console.error("Add booking to order error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async cancelOrder(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const { refundAmount, refundNote } = req.body;

      const result = await orderService.cancelOrder(
        id,
        orgId,
        refundAmount,
        refundNote
      );
      res.json(result);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Order is already cancelled") {
        return res.status(400).json({ message: error.message });
      }
      if (
        error.message.includes("Refund amount") ||
        error.message.includes("cannot exceed")
      ) {
        return res.status(400).json({ message: error.message });
      }
      if (
        error.message.includes("Cannot cancel order") ||
        error.message.includes('not in "BOOKED" status')
      ) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Cancel order error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async previewCancellationRefund(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const refundInfo = await orderService.previewOrderCancellationRefund(
        id,
        orgId
      );
      res.json(refundInfo);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Order is already cancelled") {
        return res.status(400).json({ message: error.message });
      }
      if (
        error.message.includes("Cannot cancel order") ||
        error.message.includes('not in "BOOKED" status')
      ) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Preview cancellation refund error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async collectPayment(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const { amount, note } = req.body;

      const result = await orderService.collectOrderPayment(id, orgId, {
        amount,
        note,
      });

      res.json(result);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Cannot collect payment for cancelled order") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "No active bookings in order") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "Total rent is zero, cannot distribute payment") {
        return res.status(400).json({ message: error.message });
      }
      console.error("Collect payment error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async generateInvoice(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const invoice = await orderService.generateInvoice(id, orgId);
      res.json(invoice);
    } catch (error: any) {
      if (error.message === "Order not found") {
        return res.status(404).json({ message: error.message });
      }
      console.error("Generate invoice error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
